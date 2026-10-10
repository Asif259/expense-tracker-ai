import { ConfigService } from '@nestjs/config';
export declare class HealthController {
    private readonly configService;
    constructor(configService: ConfigService);
    checkHealth(): {
        status: string;
        service: string;
        timestamp: string;
        uptime: number;
        environment: string;
        configured: {
            supabase: boolean;
            groq: boolean;
        };
    };
    root(): {
        name: string;
        status: string;
        service: string;
        timestamp: string;
        healthEndpoint: string;
    };
}
