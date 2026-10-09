import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { PostgrestError } from '@supabase/supabase-js';

export function mapDatabaseError(error: PostgrestError | Error | null | undefined): HttpException {
  if (!error) {
    return new InternalServerErrorException('An unexpected database error occurred');
  }

  // Handle PostgrestError or error with code property
  const code = (error as { code?: string }).code;
  const message = error.message || '';

  if (code) {
    switch (code) {
      // Custom PL/pgSQL Application Errors
      case 'P0001': // draft_not_available
        return new NotFoundException('Draft not found, expired, already confirmed, or locked');

      case 'P0002': // category_not_found
        return new BadRequestException('Referenced category does not exist');

      case 'P0003': // category_not_owned
        return new ForbiddenException('Category belongs to another user');

      case 'P0004': // category_type_mismatch
        return new BadRequestException('Category type does not match transaction type');

      case 'P0008': // invalid_type
        return new BadRequestException('Transaction type must be income or expense');

      case 'P0009': // invalid_amount
        return new BadRequestException('Amount must be a positive finite number not exceeding maximum permitted value');

      case 'P0010': // invalid_date
        return new BadRequestException('Invalid transaction date');

      case 'P0011': // invalid_currency
        return new BadRequestException('Currency is not supported or format is invalid');

      case 'P0012': // missing_user_id
        return new BadRequestException('User ID is required');

      case 'P0013': // invalid_amount_precision
        return new BadRequestException('Amount must have at most 2 decimal places');

      case 'P0014': // description_too_long
        return new BadRequestException('Description must be at most 500 characters');

      // PostgreSQL Standard Error Codes
      case '23503': // foreign_key_violation
        return new BadRequestException('Referenced record does not exist');

      case '23505': // unique_violation
        return new ConflictException('A record with these details already exists');

      case '23514': // check_violation
        return new BadRequestException('Database constraint check failed');

      case '42501': // insufficient_privilege / RLS policy violation
        return new ForbiddenException('Access denied by security policy');

      case 'PGRST116': // JSON object requested, multiple (or no) rows returned
        return new NotFoundException('Requested resource was not found');

      default:
        break;
    }
  }

  // Fallback checks based on message content without exposing raw SQL or stack traces
  if (message.includes('draft_not_available')) {
    return new NotFoundException('Draft not found, expired, already confirmed, or locked');
  }
  if (message.includes('category_not_found')) {
    return new BadRequestException('Referenced category does not exist');
  }
  if (message.includes('category_not_owned')) {
    return new ForbiddenException('Category belongs to another user');
  }
  if (message.includes('category_type_mismatch')) {
    return new BadRequestException('Category type does not match transaction type');
  }
  if (message.includes('chk_amount_valid')) {
    return new BadRequestException('Amount must be a positive number with at most 2 decimal places');
  }

  // Never leak internal database query or stack trace
  return new InternalServerErrorException('Database operation failed');
}
