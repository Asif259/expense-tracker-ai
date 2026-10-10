import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';

const isLiveSupabaseAvailable = !!(
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('test-')
);

describe.runIf(isLiveSupabaseAvailable)('Debt & Loan Management E2E Integration Tests', () => {
  let adminClient: SupabaseClient;
  let userAClient: SupabaseClient;
  let userBClient: SupabaseClient;
  let userAId: string;
  let userBId: string;

  const cleanupLoanIds: string[] = [];
  const cleanupUserIds: string[] = [];

  beforeEach(async () => {
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const emailA = `loan_user_a_${Date.now()}_${Math.random().toString(36).substring(7)}@ledgerly.internal`;
    const { data: authA, error: errA } = await adminClient.auth.admin.createUser({
      email: emailA,
      password: 'Password123!',
      email_confirm: true,
    });
    if (errA || !authA.user) throw new Error(`User A creation failed: ${errA?.message}`);
    userAId = authA.user.id;
    cleanupUserIds.push(userAId);

    const authClientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: sessionA } = await authClientA.auth.signInWithPassword({
      email: emailA,
      password: 'Password123!',
    });
    userAClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${sessionA!.session!.access_token}` } },
    });

    const emailB = `loan_user_b_${Date.now()}_${Math.random().toString(36).substring(7)}@ledgerly.internal`;
    const { data: authB, error: errB } = await adminClient.auth.admin.createUser({
      email: emailB,
      password: 'Password123!',
      email_confirm: true,
    });
    if (errB || !authB.user) throw new Error(`User B creation failed: ${errB?.message}`);
    userBId = authB.user.id;
    cleanupUserIds.push(userBId);

    const authClientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: sessionB } = await authClientB.auth.signInWithPassword({
      email: emailB,
      password: 'Password123!',
    });
    userBClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${sessionB!.session!.access_token}` } },
    });
  });

  afterEach(async () => {
    if (cleanupLoanIds.length > 0) {
      await adminClient.from('loans').delete().in('id', cleanupLoanIds);
    }
    for (const uid of cleanupUserIds) {
      await adminClient.auth.admin.deleteUser(uid);
    }
  });

  it('verifies loan creation, partial repayments, balance derivation, and settlement', async () => {
    // 1. User A creates a lent loan (principal: 1000.00 BDT)
    const { data: loan, error: loanErr } = await userAClient
      .from('loans')
      .insert({
        user_id: userAId,
        person_name: 'Rahim',
        direction: 'lent',
        principal_amount: 1000.00,
        currency: 'BDT',
        payment_method: 'bkash',
        loan_date: '2026-10-10',
        due_date: '2026-10-20',
        notes: 'Office lunch loan',
      })
      .select()
      .single();

    expect(loanErr).toBeNull();
    expect(loan).toBeDefined();
    cleanupLoanIds.push(loan.id);

    // 2. Query derived details view (outstanding = 1000, progress = 0, status = active)
    const { data: viewInitial } = await userAClient
      .from('loans_with_details')
      .select('*')
      .eq('id', loan.id)
      .single();

    expect(Number(viewInitial.outstanding_balance)).toBe(1000);
    expect(Number(viewInitial.total_repaid)).toBe(0);
    expect(viewInitial.status).toBe('active');

    // 3. Record partial repayment of 400.00 BDT via atomic RPC
    const { data: rep1, error: rep1Err } = await userAClient.rpc('record_loan_repayment', {
      p_loan_id: loan.id,
      p_amount: 400.00,
      p_payment_date: '2026-10-11',
      p_payment_method: 'bkash',
      p_reference: 'TRX001',
    });

    expect(rep1Err).toBeNull();
    expect(Number(rep1.outstanding_balance)).toBe(600);
    expect(Number(rep1.total_repaid)).toBe(400);
    expect(Number(rep1.progress_pct)).toBe(40);
    expect(rep1.status).toBe('active');

    // 4. Overpayment rejection: attempting to repay 700.00 BDT (when remaining is 600.00 BDT)
    const { error: overpayErr } = await userAClient.rpc('record_loan_repayment', {
      p_loan_id: loan.id,
      p_amount: 700.00,
      p_payment_date: '2026-10-12',
      p_payment_method: 'cash',
    });

    expect(overpayErr).not.toBeNull();
    expect(overpayErr?.code).toBe('P0016');

    // 5. Record remaining 600.00 BDT repayment -> Status flips to 'settled'
    const { data: rep2, error: rep2Err } = await userAClient.rpc('record_loan_repayment', {
      p_loan_id: loan.id,
      p_amount: 600.00,
      p_payment_date: '2026-10-12',
      p_payment_method: 'bank',
      p_reference: 'BANK789',
    });

    expect(rep2Err).toBeNull();
    expect(Number(rep2.outstanding_balance)).toBe(0);
    expect(Number(rep2.total_repaid)).toBe(1000);
    expect(Number(rep2.progress_pct)).toBe(100);
    expect(rep2.status).toBe('settled');

    // 6. Repayment on settled loan is rejected
    const { error: settledErr } = await userAClient.rpc('record_loan_repayment', {
      p_loan_id: loan.id,
      p_amount: 50.00,
      p_payment_date: '2026-10-13',
      p_payment_method: 'cash',
    });

    expect(settledErr).not.toBeNull();
    expect(settledErr?.code).toBe('P0015');
  }, 30000);

  it('verifies RLS user isolation and overdue status handling', async () => {
    // 1. User A creates overdue borrowed loan (due_date yesterday)
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

    const { data: loanA, error: errA } = await userAClient
      .from('loans')
      .insert({
        user_id: userAId,
        person_name: 'Karim',
        direction: 'borrowed',
        principal_amount: 500.00,
        currency: 'USD',
        payment_method: 'cash',
        loan_date: twoDaysAgo,
        due_date: yesterday,
      })
      .select()
      .single();

    expect(errA).toBeNull();
    cleanupLoanIds.push(loanA.id);

    // 2. Check derived status: should be overdue because unpaid and due_date < today
    const { data: viewA } = await userAClient
      .from('loans_with_details')
      .select('*')
      .eq('id', loanA.id)
      .single();

    expect(viewA.status).toBe('overdue');

    // 3. User B CANNOT read User A loan (RLS isolation)
    const { data: bViewA } = await userBClient
      .from('loans')
      .select('*')
      .eq('id', loanA.id);
    expect(bViewA).toHaveLength(0);

    // 4. User B CANNOT record repayment on User A loan
    const { error: bRepayErr } = await userBClient.rpc('record_loan_repayment', {
      p_loan_id: loanA.id,
      p_amount: 50.00,
      p_payment_date: '2026-10-10',
      p_payment_method: 'cash',
    });
    expect(bRepayErr).not.toBeNull();
    expect(bRepayErr?.code).toBe('P0002'); // loan_not_found

    // 5. Settling the overdue loan: settled loans must NOT remain overdue
    const { data: settleRep } = await userAClient.rpc('record_loan_repayment', {
      p_loan_id: loanA.id,
      p_amount: 500.00,
      p_payment_date: '2026-10-10',
      p_payment_method: 'cash',
    });
    expect(settleRep.status).toBe('settled');

    const { data: settledView } = await userAClient
      .from('loans_with_details')
      .select('status, outstanding_balance')
      .eq('id', loanA.id)
      .single();
    expect(settledView.status).toBe('settled');
    expect(Number(settledView.outstanding_balance)).toBe(0);
  }, 30000);
});
