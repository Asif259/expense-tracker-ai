import { Module } from '@nestjs/common';
import { AiDraftsController } from './ai-drafts.controller.js';
import { AiDraftsService } from './ai-drafts.service.js';

@Module({
  controllers: [AiDraftsController],
  providers: [AiDraftsService],
  exports: [AiDraftsService],
})
export class AiDraftsModule {}
