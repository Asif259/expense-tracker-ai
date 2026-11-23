import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';
import { AiModule } from '../ai/ai.module.js';
import { BudgetsModule } from '../budgets/budgets.module.js';
import { InvestmentsModule } from '../investments/investments.module.js';

@Module({
  imports: [AiModule, BudgetsModule, InvestmentsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
