import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';

// Only runs when real Supabase credentials and instance are configured
const isLiveSupabaseAvailable = !!(
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('test-')
);

describe.runIf(isLiveSupabaseAvailable)('Two-User End-to-End Live Integration Tests', () => {
  let adminClient: SupabaseClient;
  let userAClient: SupabaseClient;
  let userBClient: SupabaseClient;
  let userAId: string;
  let userBId: string;
  let categoryAId: string;
  let categoryBId: string;

  const cleanupTxIds: string[] = [];
  const cleanupDraftIds: string[] = [];
  const cleanupCategoryIds: string[] = [];
  const cleanupUserIds: string[] = [];

  beforeEach(async () => {
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Provision User A
    const emailA = `user_a_${Date.now()}_${Math.random().toString(36).substring(7)}@ledgerly.internal`;
    const { data: authA, error: errA } = await adminClient.auth.admin.createUser({
      email: emailA,
      password: 'Password123!',
      email_confirm: true,
    });
    if (errA || !authA.user) throw new Error(`User A creation failed: ${errA?.message}`);
    userAId = authA.user.id;
    cleanupUserIds.push(userAId);

    const { data: sessionA } = await adminClient.auth.signInWithPassword({
      email: emailA,
      password: 'Password123!',
    });
    userAClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${sessionA!.session!.access_token}` } },
    });

    // 2. Provision User B
    const emailB = `user_b_${Date.now()}_${Math.random().toString(36).substring(7)}@ledgerly.internal`;
    const { data: authB, error: errB } = await adminClient.auth.admin.createUser({
      email: emailB,
      password: 'Password123!',
      email_confirm: true,
    });
    if (errB || !authB.user) throw new Error(`User B creation failed: ${errB?.message}`);
    userBId = authB.user.id;
    cleanupUserIds.push(userBId);

    const { data: sessionB } = await adminClient.auth.signInWithPassword({
      email: emailB,
      password: 'Password123!',
    });
    userBClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${sessionB!.session!.access_token}` } },
    });

    // 3. Create categories for User A and User B
    const { data: catA } = await userAClient
      .from('categories')
      .insert({ user_id: userAId, name: `Cat A ${Date.now()}`, type: 'expense', is_system: false })
      .select()
      .single();
    if (catA) {
      categoryAId = catA.id;
      cleanupCategoryIds.push(categoryAId);
    }

    const { data: catB } = await userBClient
      .from('categories')
      .insert({ user_id: userBId, name: `Cat B ${Date.now()}`, type: 'expense', is_system: false })
      .select()
      .single();
    if (catB) {
      categoryBId = catB.id;
      cleanupCategoryIds.push(categoryBId);
    }
  });

  afterEach(async () => {
    if (cleanupTxIds.length > 0) {
      await adminClient.from('transactions').delete().in('id', cleanupTxIds);
    }
    if (cleanupDraftIds.length > 0) {
      await adminClient.from('ai_draft_transactions').delete().in('id', cleanupDraftIds);
    }
    if (cleanupCategoryIds.length > 0) {
      await adminClient.from('categories').delete().in('id', cleanupCategoryIds);
    }
    for (const uid of cleanupUserIds) {
      await adminClient.auth.admin.deleteUser(uid);
    }
  });

  it('verifies manual transaction lifecycle and cross-user isolation', async () => {
    // User A creates transaction
    const { data: txA, error: createErr } = await userAClient
      .from('transactions')
      .insert({
        user_id: userAId,
        type: 'expense',
        amount: '150.00',
        currency: 'USD',
        category_id: categoryAId,
        transaction_date: '2026-10-10',
        description: 'Office supplies',
      })
      .select()
      .single();

    expect(createErr).toBeNull();
    expect(txA).toBeDefined();
    cleanupTxIds.push(txA!.id);

    // Cross-user test: User B cannot view User A transaction
    const { data: bViewA } = await userBClient
      .from('transactions')
      .select('*')
      .eq('id', txA!.id);
    expect(bViewA).toHaveLength(0);

    // Cross-user test: User B cannot update User A transaction
    const { data: bUpdateA } = await userBClient
      .from('transactions')
      .update({ amount: '999.00' })
      .eq('id', txA!.id)
      .select();
    expect(bUpdateA).toHaveLength(0);

    // User A updates own transaction
    const { data: aUpdated, error: updateErr } = await userAClient
      .from('transactions')
      .update({ amount: '175.50' })
      .eq('id', txA!.id)
      .select()
      .single();
    expect(updateErr).toBeNull();
    expect(Number(aUpdated!.amount)).toBe(175.5);

    // Cross-user test: User B cannot delete User A transaction
    await userBClient.from('transactions').delete().eq('id', txA!.id);
    const { data: stillExists } = await userAClient
      .from('transactions')
      .select('id')
      .eq('id', txA!.id);
    expect(stillExists).toHaveLength(1);

    // User A deletes own transaction
    const { error: deleteErr } = await userAClient
      .from('transactions')
      .delete()
      .eq('id', txA!.id);
    expect(deleteErr).toBeNull();
  }, 30000);

  it('verifies AI draft lifecycle, confirmation, duplicate rejection, and cross-user rejection', async () => {
    // 1. Service role creates AI draft for User A
    const { data: draftId, error: draftErr } = await adminClient.rpc('create_ai_draft', {
      p_user_id: userAId,
      p_type: 'expense',
      p_amount: 85.00,
      p_currency: 'BDT',
      p_category_id: categoryAId,
      p_description: 'Lunch meeting',
      p_transaction_date: '2026-10-10',
    });

    expect(draftErr).toBeNull();
    expect(draftId).toBeDefined();
    cleanupDraftIds.push(draftId);

    // 2. User A can read draft
    const { data: aDrafts } = await userAClient
      .from('ai_draft_transactions')
      .select('*')
      .eq('id', draftId);
    expect(aDrafts).toHaveLength(1);

    // 3. User B CANNOT read User A draft (RLS isolation)
    const { data: bDrafts } = await userBClient
      .from('ai_draft_transactions')
      .select('*')
      .eq('id', draftId);
    expect(bDrafts).toHaveLength(0);

    // 4. User B CANNOT confirm User A draft
    const { error: bConfirmErr } = await userBClient.rpc('confirm_ai_draft', {
      p_draft_id: draftId,
    });
    expect(bConfirmErr).not.toBeNull();
    expect(bConfirmErr?.message).toContain('draft_not_available');

    // 5. User A confirms draft into real transaction
    const { data: confirmedTxId, error: aConfirmErr } = await userAClient.rpc('confirm_ai_draft', {
      p_draft_id: draftId,
    });
    expect(aConfirmErr).toBeNull();
    expect(confirmedTxId).toBeDefined();
    cleanupTxIds.push(confirmedTxId);

    // 6. Duplicate confirmation attempt fails
    const { error: duplicateErr } = await userAClient.rpc('confirm_ai_draft', {
      p_draft_id: draftId,
    });
    expect(duplicateErr).not.toBeNull();
    expect(duplicateErr?.message).toContain('draft_not_available');

    // 7. Verify draft row consumed/deleted
    const { data: consumedDraft } = await userAClient
      .from('ai_draft_transactions')
      .select('id')
      .eq('id', draftId);
    expect(consumedDraft).toHaveLength(0);

    // 8. Create second draft for User A and test discard
    const { data: draft2Id } = await adminClient.rpc('create_ai_draft', {
      p_user_id: userAId,
      p_type: 'expense',
      p_amount: 25.00,
      p_currency: 'USD',
      p_category_id: categoryAId,
      p_description: 'Discard draft test',
      p_transaction_date: '2026-10-10',
    });
    cleanupDraftIds.push(draft2Id);

    const { error: discardErr } = await userAClient
      .from('ai_draft_transactions')
      .delete()
      .eq('id', draft2Id);
    expect(discardErr).toBeNull();
  }, 30000);
});
