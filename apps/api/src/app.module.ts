import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { validateEnv } from './config/env.schema.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { HealthModule } from './health/health.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { AiDraftsModule } from './ai-drafts/ai-drafts.module.js';
import { AiModule } from './ai/ai.module.js';
import { LoansModule } from './loans/loans.module.js';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    SupabaseModule,
    HealthModule,
    TransactionsModule,
    AiDraftsModule,
    AiModule,
    LoansModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
  ],
})
export class AppModule {}
