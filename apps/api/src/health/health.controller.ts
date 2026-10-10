import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator.js';

@Controller()
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get('health')
  @Public()
  checkHealth() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL', '');
    const hasSupabase = !!supabaseUrl && !supabaseUrl.includes('placeholder');
    const groqKey = this.configService.get<string>('GROQ_API_KEY', '');
    const hasGroq = !!groqKey && !groqKey.includes('placeholder');

    return {
      status: 'ok',
      service: 'Ledgerly API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      configured: {
        supabase: hasSupabase,
        groq: hasGroq,
      },
    };
  }

  @Get()
  @Public()
  root() {
    return {
      name: 'Ledgerly API',
      status: 'ok',
      service: 'running',
      timestamp: new Date().toISOString(),
      healthEndpoint: '/health',
    };
  }
}
