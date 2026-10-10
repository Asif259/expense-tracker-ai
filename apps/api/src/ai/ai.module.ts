import { Module } from '@nestjs/common';
import { GroqService } from './groq.service.js';
import { ExpenseExtractorService } from './expense-extractor.service.js';
import { AiController } from './ai.controller.js';

@Module({
  controllers: [AiController],
  providers: [GroqService, ExpenseExtractorService],
  exports: [GroqService, ExpenseExtractorService],
})
export class AiModule {}
