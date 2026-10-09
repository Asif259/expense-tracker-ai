import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AuthToken } from '../common/decorators/auth-token.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
  transactionParamSchema,
} from './dto/transaction.schema.js';
import type {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
  TransactionParamDto,
} from './dto/transaction.schema.js';
import type { User } from '@supabase/supabase-js';

@Controller('transactions')
@UseGuards(SupabaseAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createTransactionSchema)) dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(token, user.id, dto);
  }

  @Get()
  findAll(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Query(new ZodValidationPipe(transactionQuerySchema)) query: TransactionQueryDto,
  ) {
    return this.transactionsService.findAll(token, user.id, query);
  }

  @Get(':id')
  findOne(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param(new ZodValidationPipe(transactionParamSchema)) params: TransactionParamDto,
  ) {
    return this.transactionsService.findOne(token, user.id, params.id);
  }

  @Patch(':id')
  update(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param(new ZodValidationPipe(transactionParamSchema)) params: TransactionParamDto,
    @Body(new ZodValidationPipe(updateTransactionSchema)) dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(token, user.id, params.id, dto);
  }

  @Delete(':id')
  remove(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param(new ZodValidationPipe(transactionParamSchema)) params: TransactionParamDto,
  ) {
    return this.transactionsService.remove(token, user.id, params.id);
  }
}
