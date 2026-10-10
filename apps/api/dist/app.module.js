var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', 'apps/api/.env', '../.env'],
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
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map