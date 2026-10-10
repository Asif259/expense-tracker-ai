import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
async function bootstrap() {
    try {
        const app = await NestFactory.create(AppModule);
        const configService = app.get(ConfigService);
        const rawPort = process.env.PORT || configService.get('PORT', 3001);
        const corsOriginRaw = configService.get('CORS_ORIGIN', 'http://localhost:3000');
        const configuredOrigins = corsOriginRaw.split(',').map((o) => o.trim()).filter(Boolean);
        const allowedOriginsSet = new Set();
        for (const item of configuredOrigins) {
            const trimmed = item.replace(/\/+$/, '');
            allowedOriginsSet.add(trimmed);
            if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
                allowedOriginsSet.add(`https://${trimmed}`);
                allowedOriginsSet.add(`http://${trimmed}`);
            }
        }
        app.enableCors({
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                const cleanOrigin = origin.replace(/\/+$/, '');
                if (allowedOriginsSet.has(cleanOrigin) ||
                    allowedOriginsSet.has('*') ||
                    cleanOrigin.endsWith('.vercel.app')) {
                    return callback(null, true);
                }
                const hostOnly = cleanOrigin.replace(/^https?:\/\//, '');
                if (allowedOriginsSet.has(hostOnly)) {
                    return callback(null, true);
                }
                callback(null, false);
            },
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
bootstrap().catch((error) => {
    console.error('[Ledgerly API] Fatal startup error:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map