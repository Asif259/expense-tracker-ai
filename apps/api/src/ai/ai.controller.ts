import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AuthToken } from '../common/decorators/auth-token.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { ExpenseExtractorService } from './expense-extractor.service.js';
import { parseExpenseSchema } from './dto/parse-expense.dto.js';
import type { ParseExpenseDto } from './dto/parse-expense.dto.js';
import type { User } from '@supabase/supabase-js';

@Controller('ai')
@UseGuards(SupabaseAuthGuard)
export class AiController {
  constructor(private readonly expenseExtractorService: ExpenseExtractorService) {}

  @Post('parse-expense')
  @HttpCode(HttpStatus.OK)
  async parseExpense(
    @AuthToken() token: string,
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(parseExpenseSchema)) dto: ParseExpenseDto,
  ) {
    return this.expenseExtractorService.parseAndCreateDraft(token, user.id, dto);
  }
}
