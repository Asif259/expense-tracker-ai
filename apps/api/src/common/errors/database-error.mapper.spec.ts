import { describe, it, expect } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { mapDatabaseError } from './database-error.mapper.js';
import type { PostgrestError } from '@supabase/supabase-js';

describe('database-error.mapper', () => {
  it('maps P0001 (draft_not_available) to NotFoundException', () => {
    const error = {
      name: 'PostgrestError',
      message: 'draft_not_available',
      details: 'Draft not found, expired, already confirmed, or locked',
      hint: '',
      code: 'P0001',
    } as unknown as PostgrestError;
    const exception = mapDatabaseError(error);
    expect(exception).toBeInstanceOf(NotFoundException);
    expect(exception.message).toContain('Draft not found');
  });

  it('maps P0002 (category_not_found) to BadRequestException', () => {
    const error = {
      name: 'PostgrestError',
      message: 'category_not_found',
      details: 'referenced category does not exist',
      hint: '',
      code: 'P0002',
    } as unknown as PostgrestError;
    const exception = mapDatabaseError(error);
    expect(exception).toBeInstanceOf(BadRequestException);
    expect(exception.message).toContain('Referenced category does not exist');
  });

  it('maps P0003 (category_not_owned) to ForbiddenException', () => {
    const error = {
      name: 'PostgrestError',
      message: 'category_not_owned',
      details: 'category belongs to another user',
      hint: '',
      code: 'P0003',
    } as unknown as PostgrestError;
    const exception = mapDatabaseError(error);
    expect(exception).toBeInstanceOf(ForbiddenException);
    expect(exception.message).toContain('Category belongs to another user');
  });

  it('maps P0004 (category_type_mismatch) to BadRequestException', () => {
    const error = {
      name: 'PostgrestError',
      message: 'category_type_mismatch',
      details: 'category type does not match transaction type',
      hint: '',
      code: 'P0004',
    } as unknown as PostgrestError;
    const exception = mapDatabaseError(error);
    expect(exception).toBeInstanceOf(BadRequestException);
    expect(exception.message).toContain('Category type does not match');
  });

  it('maps P0009 (invalid_amount) to BadRequestException', () => {
    const error = {
      name: 'PostgrestError',
      message: 'invalid_amount_not_positive',
      details: 'amount must be greater than zero',
      hint: '',
      code: 'P0009',
    } as unknown as PostgrestError;
    const exception = mapDatabaseError(error);
    expect(exception).toBeInstanceOf(BadRequestException);
    expect(exception.message).toContain('Amount must be a positive finite number');
  });

  it('maps P0010 (invalid_date) to BadRequestException', () => {
    const error = {
      name: 'PostgrestError',
      message: 'invalid_date_future',
      details: 'transaction_date cannot be more than one day in the future',
      hint: '',
      code: 'P0010',
    } as unknown as PostgrestError;
    const exception = mapDatabaseError(error);
    expect(exception).toBeInstanceOf(BadRequestException);
  });

  it('maps P0011 (invalid_currency) to BadRequestException', () => {
    const error = {
      name: 'PostgrestError',
      message: 'invalid_currency_not_supported',
      details: 'currency is not supported',
      hint: '',
      code: 'P0011',
    } as unknown as PostgrestError;
    const exception = mapDatabaseError(error);
    expect(exception).toBeInstanceOf(BadRequestException);
  });

  it('maps P0013 (invalid_amount_precision) to BadRequestException', () => {
    const error = {
      name: 'PostgrestError',
      message: 'invalid_amount_precision',
      details: 'amount must have at most 2 decimal places',
      hint: '',
      code: 'P0013',
    } as unknown as PostgrestError;
    const exception = mapDatabaseError(error);
    expect(exception).toBeInstanceOf(BadRequestException);
    expect(exception.message).toContain('at most 2 decimal places');
  });

  it('maps 23503 (foreign_key_violation) to BadRequestException', () => {
    const error = {
      name: 'PostgrestError',
      message: 'insert or update on table violates foreign key constraint',
      details: '',
      hint: '',
      code: '23503',
    } as unknown as PostgrestError;
    const exception = mapDatabaseError(error);
    expect(exception).toBeInstanceOf(BadRequestException);
    expect(exception.message).toContain('Referenced record does not exist');
  });

  it('maps 23505 (unique_violation) to ConflictException', () => {
    const error = {
      name: 'PostgrestError',
      message: 'duplicate key value violates unique constraint',
      details: '',
      hint: '',
      code: '23505',
    } as unknown as PostgrestError;
    const exception = mapDatabaseError(error);
    expect(exception).toBeInstanceOf(ConflictException);
  });

  it('maps 42501 (insufficient_privilege) to ForbiddenException', () => {
    const error = {
      name: 'PostgrestError',
      message: 'new row violates row-level security policy for table',
      details: '',
      hint: '',
      code: '42501',
    } as unknown as PostgrestError;
    const exception = mapDatabaseError(error);
    expect(exception).toBeInstanceOf(ForbiddenException);
  });

  it('maps PGRST116 (not found) to NotFoundException', () => {
    const error = {
      name: 'PostgrestError',
      message: 'JSON object requested, multiple (or no) rows returned',
      details: '',
      hint: '',
      code: 'PGRST116',
    } as unknown as PostgrestError;
    const exception = mapDatabaseError(error);
    expect(exception).toBeInstanceOf(NotFoundException);
  });

  it('maps unknown internal errors to generic InternalServerErrorException without leaking SQL', () => {
    const error = {
      name: 'PostgrestError',
      message: 'SELECT * FROM internal_secrets WHERE id = 123 failed syntax',
      details: 'syntax error at or near internal_secrets',
      hint: '',
      code: '42601',
    } as unknown as PostgrestError;
    const exception = mapDatabaseError(error);
    expect(exception).toBeInstanceOf(InternalServerErrorException);
    expect(exception.message).toBe('Database operation failed');
    expect(exception.message).not.toContain('internal_secrets');
  });
});
