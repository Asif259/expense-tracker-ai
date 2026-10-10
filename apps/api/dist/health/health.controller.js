var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator.js';
let HealthController = class HealthController {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    checkHealth() {
        const supabaseUrl = this.configService.get('SUPABASE_URL', '');
        const hasSupabase = !!supabaseUrl && !supabaseUrl.includes('placeholder');
        const groqKey = this.configService.get('GROQ_API_KEY', '');
        const hasGroq = !!groqKey && !groqKey.includes('placeholder');
        return {
            status: 'ok',
            service: 'Ledgerly API',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: this.configService.get('NODE_ENV', 'development'),
            configured: {
                supabase: hasSupabase,
                groq: hasGroq,
            },
        };
    }
    root() {
        return {
            name: 'Ledgerly API',
            status: 'ok',
            service: 'running',
            timestamp: new Date().toISOString(),
            healthEndpoint: '/health',
        };
    }
};
__decorate([
    Get('health'),
    Public(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "checkHealth", null);
__decorate([
    Get(),
    Public(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "root", null);
HealthController = __decorate([
    Controller(),
    __metadata("design:paramtypes", [ConfigService])
], HealthController);
export { HealthController };
//# sourceMappingURL=health.controller.js.map