import { Module } from '@nestjs/common';
import { InvestmentsController } from './investments.controller.js';
import { InvestmentsService } from './investments.service.js';
import { GoldRateService } from './gold-rate.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Module({
  imports: [SupabaseModule],
  controllers: [InvestmentsController],
  providers: [InvestmentsService, GoldRateService],
})
export class InvestmentsModule {}
