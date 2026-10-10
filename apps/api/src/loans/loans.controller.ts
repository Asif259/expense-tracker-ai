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
} from '@nestjs/common';
import { LoansService } from './loans.service.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AuthToken } from '../common/decorators/auth-token.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import {
  createLoanSchema,
  updateLoanSchema,
  recordRepaymentSchema,
  loanQuerySchema,
  loanParamSchema,
  repaymentParamSchema,
} from '@ledgerly/shared-types';
import type {
  CreateLoanDto,
  UpdateLoanDto,
  RecordRepaymentDto,
  LoanQueryDto,
  LoanParamDto,
  RepaymentParamDto,
} from '@ledgerly/shared-types';
import type { User } from '@supabase/supabase-js';

@Controller('loans')
@UseGuards(SupabaseAuthGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createLoanSchema)) dto: CreateLoanDto,
  ) {
    return this.loansService.create(token, user.id, dto);
  }

  @Get()
  findAll(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Query(new ZodValidationPipe(loanQuerySchema)) query: LoanQueryDto,
  ) {
    return this.loansService.findAll(token, user.id, query);
  }

  @Get('summary')
  getSummary(
    @AuthToken() token: string,
    @CurrentUser() user: User,
  ) {
    return this.loansService.getSummary(token, user.id);
  }

  @Get(':id')
  findOne(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param(new ZodValidationPipe(loanParamSchema)) params: LoanParamDto,
  ) {
    return this.loansService.findOne(token, user.id, params.id);
  }

  @Patch(':id')
  update(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param(new ZodValidationPipe(loanParamSchema)) params: LoanParamDto,
    @Body(new ZodValidationPipe(updateLoanSchema)) dto: UpdateLoanDto,
  ) {
    return this.loansService.update(token, user.id, params.id, dto);
  }

  @Delete(':id')
  remove(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param(new ZodValidationPipe(loanParamSchema)) params: LoanParamDto,
  ) {
    return this.loansService.remove(token, user.id, params.id);
  }

  @Post(':id/repayments')
  @HttpCode(HttpStatus.CREATED)
  recordRepayment(
    @AuthToken() token: string,
    @Param(new ZodValidationPipe(loanParamSchema)) params: LoanParamDto,
    @Body(new ZodValidationPipe(recordRepaymentSchema)) dto: RecordRepaymentDto,
  ) {
    return this.loansService.recordRepayment(token, params.id, dto);
  }

  @Delete(':id/repayments/:repaymentId')
  removeRepayment(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param(new ZodValidationPipe(repaymentParamSchema)) params: RepaymentParamDto,
  ) {
    return this.loansService.removeRepayment(token, user.id, params.id, params.repaymentId);
  }
}
