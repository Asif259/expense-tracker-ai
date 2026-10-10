import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const port = configService.get('PORT', 3001);
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
    await app.listen(port);
}
await bootstrap();
//# sourceMappingURL=main.js.map