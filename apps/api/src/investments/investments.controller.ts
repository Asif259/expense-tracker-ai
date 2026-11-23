// File: apps/api/src/investments/investments.controller.ts
// Purpose: Controller exposing investment CRUD endpoints
// Callers: Frontend API client, will be protected by SupabaseAuthGuard
// Follows existing controller patterns in loans/transactions modules

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
import { InvestmentsService } from './investments.service.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AuthToken } from '../common/decorators/auth-token.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import {
  createInvestmentSchema,
  updateInvestmentSchema,
  sellInvestmentSchema,
  investmentSummarySchema,
  goldRateSchema,
  metalRateCacheSchema,
} from '@ledgerly/shared-types';
import type {
  CreateInvestmentDto,
  UpdateInvestmentDto,
  SellInvestmentDto,
  InvestmentSummary,
  MetalRateCache,
} from '@ledgerly/shared-types';
import type { User } from '@supabase/supabase-js';

@Controller('investments')
@UseGuards(SupabaseAuthGuard)
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createInvestmentSchema))
    dto: CreateInvestmentDto,
  ) {
    return this.investmentsService.create(token, user.id, dto);
  }

  @Get()
  findAll(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Query() query: any,
  ) {
    const search = query.search;
    const assetType = query.assetType;
    const status = query.status;
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    return this.investmentsService.findAll(
      token,
      user.id,
      search,
      assetType,
      status,
      limit,
      offset,
    );
  }

  @Get('summary')
  getSummary(@AuthToken() token: string, @CurrentUser() user: User) {
    return this.investmentsService.getSummary(token, user.id);
  }

  @Get('gold/rates')
  getGoldRates(@Query('refresh') refresh?: boolean): Promise<MetalRateCache[]> {
    // Will be implemented by GoldRateService
    // Placeholder to satisfy TypeScript until service is injected
    return Promise.resolve([]);
  }

  @Get(':id')
  findOne(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.investmentsService.findOne(token, user.id, id);
  }

  @Patch(':id')
  update(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateInvestmentSchema))
    dto: UpdateInvestmentDto,
  ) {
    return this.investmentsService.update(token, user.id, id, dto);
  }

  @Post(':id/sell')
  sell(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(sellInvestmentSchema)) dto: SellInvestmentDto,
  ) {
    return this.investmentsService.sell(token, user.id, id, dto);
  }

  @Delete(':id')
  delete(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.investmentsService.delete(token, user.id, id);
  }
}
