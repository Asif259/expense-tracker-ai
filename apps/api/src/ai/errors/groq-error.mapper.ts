import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

const logger = new Logger('GroqErrorMapper');

export function mapGroqError(error: unknown): HttpException {
  if (error instanceof HttpException) {
    return error;
  }

  const errObj = error as Record<string, unknown> | null;
  const status = typeof errObj?.['status'] === 'number' ? errObj['status'] : null;
  const errorName = typeof errObj?.['name'] === 'string' ? errObj['name'] : '';

  // Log error safely without leaking secrets or full dump
  logger.error(`AI Provider error: ${errorName || 'UnknownError'} (Status: ${status})`);

  // Handle Rate Limiting (429)
  if (status === 429 || errorName === 'RateLimitError') {
    return new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: 'AI service rate limit exceeded. Please try again shortly.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  // Handle Timeouts
  if (
    errorName === 'APIConnectionTimeoutError' ||
    errorName === 'TimeoutError' ||
    (typeof errObj?.['message'] === 'string' && errObj['message'].includes('timeout'))
  ) {
    return new GatewayTimeoutException('AI service request timed out. Please try again.');
  }

  // Handle Authentication Failure (Provider Key Issue - never leak key or details)
  if (status === 401 || errorName === 'AuthenticationError') {
    return new InternalServerErrorException('AI service authentication configuration error');
  }

  // Handle Bad Gateway / Connection Errors
  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    errorName === 'APIConnectionError'
  ) {
    return new BadGatewayException('AI service provider is temporarily unavailable');
  }

  // Generic AI provider fallback
  return new BadGatewayException('Failed to process request with AI provider');
}
