import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AiDraftsService } from './ai-drafts.service.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AuthToken } from '../common/decorators/auth-token.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import {
  createAiDraftSchema,
  aiDraftParamSchema,
} from './dto/ai-draft.schema.js';
import type {
  CreateAiDraftDto,
  AiDraftParamDto,
} from './dto/ai-draft.schema.js';
import type { User } from '@supabase/supabase-js';

@Controller('ai-drafts')
@UseGuards(SupabaseAuthGuard)
export class AiDraftsController {
  constructor(private readonly aiDraftsService: AiDraftsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createAiDraftSchema)) dto: CreateAiDraftDto,
  ) {
    return this.aiDraftsService.createDraft(user.id, dto);
  }

  @Get()
  list(
    @AuthToken() token: string,
    @CurrentUser() user: User,
  ) {
    return this.aiDraftsService.listDrafts(token, user.id);
  }

  @Get(':id')
  get(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param(new ZodValidationPipe(aiDraftParamSchema)) params: AiDraftParamDto,
  ) {
    return this.aiDraftsService.getDraft(token, user.id, params.id);
  }

  @Delete(':id')
  delete(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Param(new ZodValidationPipe(aiDraftParamSchema)) params: AiDraftParamDto,
  ) {
    return this.aiDraftsService.deleteDraft(token, user.id, params.id);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  confirm(
    @AuthToken() token: string,
    @Param(new ZodValidationPipe(aiDraftParamSchema)) params: AiDraftParamDto,
  ) {
    return this.aiDraftsService.confirmDraft(token, params.id);
  }
}
