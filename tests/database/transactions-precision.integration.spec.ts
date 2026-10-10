// tests/database/transactions-precision.integration.spec.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for database integration testing
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';

// Check if live Supabase is configured
const isLiveSupabaseAvailable = !!(
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

describe.runIf(isLiveSupabaseAvailable)(
  'T46 & T47: Currency Allowlist & End-to-End Scale/Precision Integration Tests',
  () => {
    const MAX_AMOUNT = '9999999999999.99';
    const ABOVE_MAX = '10000000000000.00';

    let adminClient: SupabaseClient;
    let userClient: SupabaseClient;
    let fixtureUserId: string;
    let fixtureCategoryId: string;
    let createdTxIds: string[] = [];
    let createdDraftIds: string[] = [];

    beforeEach(async () => {
      createdTxIds = [];
      createdDraftIds = [];
      adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      // Create test user and session
      const testEmail = `test_${Date.now()}_${Math.random().toString(36).substring(7)}@ledgerly.internal`;
      const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: 'Password123!',
        email_confirm: true,
      });
      if (authErr || !authData.user) {
        throw new Error(`Failed to create test user: ${authErr?.message}`);
      }
      fixtureUserId = authData.user.id;

      // User-authenticated client using isolated auth client
      const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: sessionData, error: sessionErr } = await authClient.auth.signInWithPassword({
        email: testEmail,
        password: 'Password123!',
      });
      if (sessionErr || !sessionData.session) {
        throw new Error(`Failed to sign in test user: ${sessionErr?.message}`);
      }
      userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        },
      });

      // Create an owned test category
      const { data: catData, error: catErr } = await userClient
        .from('categories')
        .insert({
          user_id: fixtureUserId,
          name: `Test Cat ${Date.now()}`,
          type: 'expense',
          is_system: false,
        })
        .select()
        .single();

      if (catErr || !catData) {
        throw new Error(`Failed to create test category: ${catErr?.message}`);
      }
      fixtureCategoryId = catData.id;
    });

    afterEach(async () => {
      if (createdTxIds.length > 0) {
        await adminClient.from('transactions').delete().in('id', createdTxIds);
      }
      if (createdDraftIds.length > 0) {
        await adminClient.from('ai_draft_transactions').delete().in('id', createdDraftIds);
      }
      if (fixtureCategoryId) {
        await adminClient.from('categories').delete().eq('id', fixtureCategoryId);
      }
      if (fixtureUserId) {
        await adminClient.auth.admin.deleteUser(fixtureUserId);
      }
    });

    describe('Write Path 1: Direct Table INSERT (Manual Transactions)', () => {
      it('rejects numeric input 10.999 with SQLSTATE 23514 and does not silently round to 11.00', async () => {
        const { error } = await userClient.from('transactions').insert({
          user_id: fixtureUserId,
          type: 'expense',
          amount: 10.999, // Raw numeric literal
          currency: 'BDT',
          category_id: fixtureCategoryId,
          transaction_date: '2026-10-09',
        });

        expect(error).not.toBeNull();
        expect(error?.code).toBe('23514'); // chk_amount_valid violation

        // Confirm 11.00 was not created
        const { data: rows } = await userClient
          .from('transactions')
          .select('id')
          .eq('user_id', fixtureUserId)
          .eq('amount', '11.00');
        expect(rows).toHaveLength(0);
      });

      it('rejects string input "10.999" with SQLSTATE 23514 and does not silently round to 11.00', async () => {
        const { error } = await userClient.from('transactions').insert({
          user_id: fixtureUserId,
          type: 'expense',
          amount: '10.999', // String representation
          currency: 'BDT',
          category_id: fixtureCategoryId,
          transaction_date: '2026-10-09',
        });

        expect(error).not.toBeNull();
        expect(error?.code).toBe('23514');

        const { data: rows } = await userClient
          .from('transactions')
          .select('id')
          .eq('user_id', fixtureUserId)
          .eq('amount', '11.00');
        expect(rows).toHaveLength(0);
      });

      it('rejects string input "10.500" due to scale(amount) <= 2 constraint', async () => {
        const { error } = await userClient.from('transactions').insert({
          user_id: fixtureUserId,
          type: 'expense',
          amount: '10.500', // Forwarded string preserving scale = 3
          currency: 'BDT',
          category_id: fixtureCategoryId,
          transaction_date: '2026-10-09',
        });

        expect(error).not.toBeNull();
        expect(error?.code).toBe('23514'); // chk_amount_valid violation
      });

      it('accepts valid 2-decimal string "10.99" and maximum supported amount', async () => {
        const { data: tx1, error: err1 } = await userClient.from('transactions').insert({
          user_id: fixtureUserId,
          type: 'expense',
          amount: '10.99',
          currency: 'BDT',
          category_id: fixtureCategoryId,
          transaction_date: '2026-10-09',
        }).select().single();

        expect(err1).toBeNull();
        if (tx1) {
          createdTxIds.push(tx1.id);
          expect(Number(tx1.amount)).toBe(10.99);
        }

        const { data: tx2, error: err2 } = await userClient.from('transactions').insert({
          user_id: fixtureUserId,
          type: 'expense',
          amount: MAX_AMOUNT,
          currency: 'BDT',
          category_id: fixtureCategoryId,
          transaction_date: '2026-10-09',
        }).select().single();

        expect(err2).toBeNull();
        if (tx2) {
          createdTxIds.push(tx2.id);
          expect(Number(tx2.amount)).toBe(Number(MAX_AMOUNT));
        }
      });

      it('rejects amount exceeding maximum ("10000000000000.00")', async () => {
        const { error } = await userClient.from('transactions').insert({
          user_id: fixtureUserId,
          type: 'expense',
          amount: ABOVE_MAX,
          currency: 'BDT',
          category_id: fixtureCategoryId,
          transaction_date: '2026-10-09',
        });

        expect(error).not.toBeNull();
        expect(error?.code).toBe('23514');
      });

      it('accepts supported currencies JPY and CAD, and rejects unsupported currency XYZ', async () => {
        // JPY accepted
        const { data: txJpy, error: errJpy } = await userClient.from('transactions').insert({
          user_id: fixtureUserId,
          type: 'expense',
          amount: '1500.00',
          currency: 'JPY',
          category_id: fixtureCategoryId,
          transaction_date: '2026-10-09',
        }).select().single();

        expect(errJpy).toBeNull();
        if (txJpy) {
          createdTxIds.push(txJpy.id);
          expect(txJpy.currency).toBe('JPY');
        }

        // CAD accepted
        const { data: txCad, error: errCad } = await userClient.from('transactions').insert({
          user_id: fixtureUserId,
          type: 'expense',
          amount: '25.00',
          currency: 'CAD',
          category_id: fixtureCategoryId,
          transaction_date: '2026-10-09',
        }).select().single();

        expect(errCad).toBeNull();
        if (txCad) {
          createdTxIds.push(txCad.id);
          expect(txCad.currency).toBe('CAD');
        }

        // XYZ rejected by domain constraint chk_currency_supported
        const { error: errXyz } = await userClient.from('transactions').insert({
          user_id: fixtureUserId,
          type: 'expense',
          amount: '10.00',
          currency: 'XYZ',
          category_id: fixtureCategoryId,
          transaction_date: '2026-10-09',
        });

        expect(errXyz).not.toBeNull();
        expect(errXyz?.code).toBe('23514');
      });
    });

    describe('Write Path 2: create_ai_draft RPC', () => {
      it('rejects string "10.500" with P0013 and creates no draft row', async () => {
        const { data: draftId, error } = await adminClient.rpc('create_ai_draft', {
          p_user_id: fixtureUserId,
          p_type: 'expense',
          p_amount: '10.500',
          p_currency: 'BDT',
          p_category_id: fixtureCategoryId,
          p_description: 'Lunch',
          p_transaction_date: '2026-10-09',
        });

        expect(error?.code).toBe('P0013');
        expect(draftId).toBeFalsy();

        const { data: drafts } = await adminClient
          .from('ai_draft_transactions')
          .select('id')
          .eq('user_id', fixtureUserId);
        expect(drafts).toHaveLength(0);
      });

      it('rejects string "10.999" with P0013 and creates no draft row', async () => {
        const { data: draftId, error } = await adminClient.rpc('create_ai_draft', {
          p_user_id: fixtureUserId,
          p_type: 'expense',
          p_amount: '10.999',
          p_currency: 'BDT',
          p_category_id: fixtureCategoryId,
          p_description: 'Lunch',
          p_transaction_date: '2026-10-09',
        });

        expect(error?.code).toBe('P0013');
        expect(draftId).toBeFalsy();

        const { data: drafts } = await adminClient
          .from('ai_draft_transactions')
          .select('id')
          .eq('user_id', fixtureUserId);
        expect(drafts).toHaveLength(0);
      });
    });

    describe('Write Path 3: confirm_ai_draft RPC', () => {
      it('rejects draft containing "10.500", rolls back, creates no transaction, and preserves the draft', async () => {
        // 1. Seed draft containing "10.500"
        const { data: draft, error: seedErr } = await adminClient.from('ai_draft_transactions').insert({
          user_id: fixtureUserId,
          payload: {
            type: 'expense',
            amount: '10.500',
            currency: 'BDT',
            category_id: fixtureCategoryId,
            transaction_date: '2026-10-09',
          },
        }).select().single();
        expect(seedErr).toBeNull();
        createdDraftIds.push(draft.id);

        // 2. Call confirm_ai_draft
        const { error } = await userClient.rpc('confirm_ai_draft', { p_draft_id: draft.id });

        expect(error?.code).toBe('P0013');

        // 3. Verify no transaction was created
        const { data: txs } = await userClient
          .from('transactions')
          .select('id')
          .eq('user_id', fixtureUserId);
        expect(txs).toHaveLength(0);

        // 4. Verify draft row is intact in ai_draft_transactions
        const { data: draftCheck } = await adminClient
          .from('ai_draft_transactions')
          .select('id')
          .eq('id', draft.id);
        expect(draftCheck).toHaveLength(1);
      });

      it('rejects draft containing "10.999", rolls back, creates no transaction, and preserves the draft', async () => {
        const { data: draft, error: seedErr } = await adminClient.from('ai_draft_transactions').insert({
          user_id: fixtureUserId,
          payload: {
            type: 'expense',
            amount: '10.999',
            currency: 'BDT',
            category_id: fixtureCategoryId,
            transaction_date: '2026-10-09',
          },
        }).select().single();
        expect(seedErr).toBeNull();
        createdDraftIds.push(draft.id);

        const { error } = await userClient.rpc('confirm_ai_draft', { p_draft_id: draft.id });

        expect(error?.code).toBe('P0013');

        const { data: txs } = await userClient
          .from('transactions')
          .select('id')
          .eq('user_id', fixtureUserId);
        expect(txs).toHaveLength(0);

        const { data: draftCheck } = await adminClient
          .from('ai_draft_transactions')
          .select('id')
          .eq('id', draft.id);
        expect(draftCheck).toHaveLength(1);
      });
    });
  }
);
