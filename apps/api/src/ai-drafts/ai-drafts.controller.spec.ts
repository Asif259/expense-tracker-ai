import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiDraftsController } from './ai-drafts.controller.js';
import { AiDraftsService } from './ai-drafts.service.js';
import type { User } from '@supabase/supabase-js';

describe('AiDraftsController', () => {
  let controller: AiDraftsController;
  let service: AiDraftsService;

  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };
  const mockToken = 'mock-bearer-token';
  const mockDraftId = '880e8400-e29b-41d4-a716-446655440003';

  beforeEach(() => {
    service = {
      createDraft: vi.fn(),
      listDrafts: vi.fn(),
      getDraft: vi.fn(),
      deleteDraft: vi.fn(),
      confirmDraft: vi.fn(),
    } as unknown as AiDraftsService;

    controller = new AiDraftsController(service);
  });

  it('delegates create to service deriving userId from authenticated user', async () => {
    const dto = {
      type: 'expense' as const,
      amount: '30.00',
      currency: 'GBP' as const,
      category_id: '660e8400-e29b-41d4-a716-446655440001',
      description: 'Train ticket',
      transaction_date: '2026-03-15',
    };

    vi.spyOn(service, 'createDraft').mockResolvedValue({ id: mockDraftId, message: 'Draft created' });

    const result = await controller.create(mockUser, dto);

    expect(service.createDraft).toHaveBeenCalledWith(mockUser.id, dto);
    expect(result).toHaveProperty('id', mockDraftId);
  });

  it('delegates list to service with user token and id', async () => {
    vi.spyOn(service, 'listDrafts').mockResolvedValue({ data: [], total: 0 });

    const result = await controller.list(mockToken, mockUser);

    expect(service.listDrafts).toHaveBeenCalledWith(mockToken, mockUser.id);
    expect(result.data).toEqual([]);
  });

  it('delegates get to service', async () => {
    vi.spyOn(service, 'getDraft').mockResolvedValue({ id: mockDraftId, payload: {} } as any);

    const result = await controller.get(mockToken, mockUser, { id: mockDraftId });

    expect(service.getDraft).toHaveBeenCalledWith(mockToken, mockUser.id, mockDraftId);
    expect(result.id).toBe(mockDraftId);
  });

  it('delegates delete to service', async () => {
    vi.spyOn(service, 'deleteDraft').mockResolvedValue({ message: 'Deleted', id: mockDraftId });

    const result = await controller.delete(mockToken, mockUser, { id: mockDraftId });

    expect(service.deleteDraft).toHaveBeenCalledWith(mockToken, mockUser.id, mockDraftId);
    expect(result.id).toBe(mockDraftId);
  });

  it('delegates confirm to service using caller token', async () => {
    const txId = '990e8400-e29b-41d4-a716-446655440004';
    vi.spyOn(service, 'confirmDraft').mockResolvedValue({
      message: 'Draft confirmed',
      transactionId: txId,
    });

    const result = await controller.confirm(mockToken, { id: mockDraftId });

    expect(service.confirmDraft).toHaveBeenCalledWith(mockToken, mockDraftId);
    expect(result.transactionId).toBe(txId);
  });
});
