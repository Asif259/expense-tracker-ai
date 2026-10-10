import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { GroqService } from './groq.service.js';

describe('GroqService', () => {
  let service: GroqService;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    mockConfigService = {
      getOrThrow: vi.fn().mockReturnValue('gsk_test_api_key'),
      get: vi.fn().mockImplementation((key, defaultVal) => {
        if (key === 'GROQ_MODEL') return 'llama-3.3-70b-versatile';
        return defaultVal;
      }),
    } as unknown as ConfigService;

    service = new GroqService(mockConfigService);
  });

  it('initializes with model name from configuration', () => {
    expect(service.getModelName()).toBe('llama-3.3-70b-versatile');
  });

  it('generates structured response using Groq client', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: '{"type":"expense","amount":"350","currency":"BDT"}',
          },
        },
      ],
    };

    const client = (service as any).client;
    vi.spyOn(client.chat.completions, 'create').mockResolvedValue(mockResponse as any);

    const result = await service.generateStructuredResponse('system prompt', 'user prompt');
    expect(result).toBe('{"type":"expense","amount":"350","currency":"BDT"}');
    expect(client.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
      }),
      expect.anything(),
    );
  });

  it('maps error when completion fails', async () => {
    const client = (service as any).client;
    vi.spyOn(client.chat.completions, 'create').mockRejectedValue({
      name: 'RateLimitError',
      status: 429,
      message: 'Rate limit exceeded',
    });

    await expect(
      service.generateStructuredResponse('system prompt', 'user prompt'),
    ).rejects.toThrow();
  });
});
