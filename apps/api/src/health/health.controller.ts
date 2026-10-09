import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator.js';

@Controller()
export class HealthController {
  @Get('health')
  @Public()
  checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get()
  @Public()
  root() {
    return {
      name: 'Ledgerly API',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
