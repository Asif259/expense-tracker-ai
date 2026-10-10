import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
async function bootstrap() {
    try {
        const app = await NestFactory.create(AppModule);
        const configService = app.get(ConfigService);
        const rawPort = process.env.PORT || configService.get('PORT', 3001);
        const corsOriginRaw = configService.get('CORS_ORIGIN', 'http://localhost:3000');
        const allowedOrigins = corsOriginRaw.includes(',')
            ? corsOriginRaw.split(',').map((o) => o.trim()).filter(Boolean)
            : corsOriginRaw.trim();
        app.enableCors({
            origin: allowedOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        });
        const isSocket = typeof rawPort === 'string' && isNaN(Number(rawPort));
        if (isSocket) {
            await app.listen(rawPort);
            console.log(`[Ledgerly API] Server listening on socket ${rawPort}`);
        }
        else {
            const port = Number(rawPort) || 3001;
            await app.listen(port, '0.0.0.0');
            console.log(`[Ledgerly API] Server listening on port ${port} (0.0.0.0)`);
        }
    }
    catch (error) {
        console.error('[Ledgerly API] Fatal startup error:', error);
        process.exit(1);
    }
}
await bootstrap();
//# sourceMappingURL=main.js.map