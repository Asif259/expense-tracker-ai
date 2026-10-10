import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Groq } from 'groq-sdk';
import { mapGroqError } from './errors/groq-error.mapper.js';

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly client: Groq;
  private readonly model: string;
  private readonly defaultTimeoutMs: number = 20000;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('GROQ_API_KEY');
    this.model = this.configService.get<string>('GROQ_MODEL', 'llama-3.3-70b-versatile');

    // Private client instance - key is never logged or exposed
    this.client = new Groq({
      apiKey,
      timeout: this.defaultTimeoutMs,
    });
  }

  /**
   * Generates a structured JSON response from Groq using json_object format.
   * Treats model output as untrusted and enforces request timeout and safe error mapping.
   */
  async generateStructuredResponse(
    systemPrompt: string,
    userPrompt: string,
    timeoutMs: number = this.defaultTimeoutMs,
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.client.chat.completions.create(
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1, // Low temperature for deterministic factual extraction
        },
        {
          signal: controller.signal,
        },
      );

      const content = response.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new Error('Groq returned empty response content');
      }

      return content;
    } catch (error) {
      if (controller.signal.aborted) {
        throw mapGroqError({ name: 'APIConnectionTimeoutError', message: 'Request timed out' });
      }
      throw mapGroqError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  getModelName(): string {
    return this.model;
  }
}
