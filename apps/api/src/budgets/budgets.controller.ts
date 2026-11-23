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
import { BudgetsService } from './budgets.service.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AuthToken } from '../common/decorators/auth-token.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import {
  createBudgetSchema,
  updateBudgetSchema,
  budgetQuerySchema,
} from '@ledgerly/shared-types';
import type {
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetQueryDto,
} from '@ledgerly/shared-types';
import type { User } from '@supabase/supabase-js';

@Controller('budgets')
@UseGuards(SupabaseAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createBudgetSchema)) dto: CreateBudgetDto,
  ) {
    return this.budgetsService.create(token, user.id, dto);
  }

  @Get()
  findAll(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Query(new ZodValidationPipe(budgetQuerySchema)) query: BudgetQueryDto,
  ) {
    return this.budgetsService.findAll(token, user.id, query);
  }

  @Get(':id')
  findOne(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.budgetsService.findOne(token, user.id, id);
  }

  @Patch(':id')
  update(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBudgetSchema)) dto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(token, user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.budgetsService.remove(token, user.id, id);
  }

  @Get('progress')
  getProgress(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    return this.budgetsService.getProgress(token, user.id, y, m);
  }
}
