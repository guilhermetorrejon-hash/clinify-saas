import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Aumentar limite para suportar múltiplas fotos em base64 (~50MB)
  // O "verify" salva o body original (cru) no req.rawBody — isso é
  // necessário para validar a assinatura HMAC de webhooks (Kiwify)
  const { json, urlencoded } = await import('express');
  app.use(json({
    limit: '50mb',
    verify: (req: any, _res, buf) => { req.rawBody = buf; },
  }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // ✅ CORS — aceita múltiplas origens separadas por vírgula
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl && process.env.NODE_ENV === 'production') {
    throw new Error('❌ FRONTEND_URL é obrigatório em produção');
  }
  const allowedOrigins = frontendUrl
    ? frontendUrl.split(',').map(u => u.trim())
    : ['http://localhost:3000', 'http://localhost:3002'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('ClinicFeed API')
    .setDescription('API da plataforma ClinicFeed para profissionais da saúde')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`ClinicFeed API rodando na porta ${port}`);
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}
bootstrap();
