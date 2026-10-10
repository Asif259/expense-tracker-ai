import { describe, it, expect } from 'vitest';
import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { mapGroqError } from './groq-error.mapper.js';

describe('groq-error.mapper', () => {
  it('maps RateLimitError or 429 status to TOO_MANY_REQUESTS HttpException', () => {
    const error = { name: 'RateLimitError', status: 429, message: 'Rate limit reached' };
    const result = mapGroqError(error);

    expect(result).toBeInstanceOf(HttpException);
    expect(result.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(result.message).toContain('rate limit exceeded');
  });

  it('maps APIConnectionTimeoutError to GatewayTimeoutException', () => {
    const error = { name: 'APIConnectionTimeoutError', message: 'Connection timed out' };
    const result = mapGroqError(error);

    expect(result).toBeInstanceOf(GatewayTimeoutException);
    expect(result.message).toContain('timed out');
  });

  it('maps AuthenticationError or 401 to InternalServerErrorException without leaking keys', () => {
    const error = {
      name: 'AuthenticationError',
      status: 401,
      message: 'Invalid API Key gsk_secret_key_123',
    };
    const result = mapGroqError(error);

    expect(result).toBeInstanceOf(InternalServerErrorException);
    expect(result.message).toBe('AI service authentication configuration error');
    expect(result.message).not.toContain('gsk_secret_key_123');
  });

  it('maps 502/503/504 status to BadGatewayException', () => {
    const error = { status: 503, message: 'Service Unavailable' };
    const result = mapGroqError(error);

    expect(result).toBeInstanceOf(BadGatewayException);
    expect(result.message).toContain('temporarily unavailable');
  });

  it('maps generic errors to generic BadGatewayException', () => {
    const error = new Error('Unexpected crash in provider client');
    const result = mapGroqError(error);

    expect(result).toBeInstanceOf(BadGatewayException);
    expect(result.message).toBe('Failed to process request with AI provider');
  });

  it('passes through existing HttpException directly', () => {
    const existing = new GatewayTimeoutException('Custom timeout');
    const result = mapGroqError(existing);

    expect(result).toBe(existing);
  });
});
