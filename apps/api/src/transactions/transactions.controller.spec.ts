import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';
import type { User } from '@supabase/supabase-js';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };
  const mockToken = 'mock-bearer-token';

  beforeEach(() => {
    service = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    } as unknown as TransactionsService;

    controller = new TransactionsController(service);
  });

  it('delegates create to service with authenticated user ID', async () => {
    const dto = {
      type: 'expense' as const,
      amount: '50.00',
      currency: 'USD' as const,
      category_id: '660e8400-e29b-41d4-a716-446655440001',
      description: 'Coffee',
      transaction_date: '2026-03-15',
    };

    vi.spyOn(service, 'create').mockResolvedValue({ id: 'tx-1', ...dto, user_id: mockUser.id });

    const result = await controller.create(mockToken, mockUser, dto);

    expect(service.create).toHaveBeenCalledWith(mockToken, mockUser.id, dto);
    expect(result).toHaveProperty('id', 'tx-1');
  });

  it('delegates findAll to service with query params', async () => {
    const query = { limit: 10, offset: 0 };
    vi.spyOn(service, 'findAll').mockResolvedValue({ data: [], total: 0, limit: 10, offset: 0 });

    const result = await controller.findAll(mockToken, mockUser, query);

    expect(service.findAll).toHaveBeenCalledWith(mockToken, mockUser.id, query);
    expect(result.data).toEqual([]);
  });

  it('delegates findOne to service with transaction ID', async () => {
    const txId = '770e8400-e29b-41d4-a716-446655440002';
    vi.spyOn(service, 'findOne').mockResolvedValue({ id: txId, amount: '50.00' });

    const result = await controller.findOne(mockToken, mockUser, { id: txId });

    expect(service.findOne).toHaveBeenCalledWith(mockToken, mockUser.id, txId);
    expect(result.id).toBe(txId);
  });

  it('delegates update to service', async () => {
    const txId = '770e8400-e29b-41d4-a716-446655440002';
    const updateDto = { amount: '75.00' };
    vi.spyOn(service, 'update').mockResolvedValue({ id: txId, amount: '75.00' });

    const result = await controller.update(mockToken, mockUser, { id: txId }, updateDto);

    expect(service.update).toHaveBeenCalledWith(mockToken, mockUser.id, txId, updateDto);
    expect(result.amount).toBe('75.00');
  });

  it('delegates remove to service', async () => {
    const txId = '770e8400-e29b-41d4-a716-446655440002';
    vi.spyOn(service, 'remove').mockResolvedValue({ message: 'Deleted', id: txId });

    const result = await controller.remove(mockToken, mockUser, { id: txId });

    expect(service.remove).toHaveBeenCalledWith(mockToken, mockUser.id, txId);
    expect(result.id).toBe(txId);
  });
});
