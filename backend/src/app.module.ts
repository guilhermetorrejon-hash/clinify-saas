import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { StorageModule } from './modules/storage/storage.module';
import { AiModule } from './modules/ai/ai.module';
import { QueuesModule } from './queues/queues.module';
import { AuthModule } from './modules/auth/auth.module';
import { BrandKitModule } from './modules/brand-kit/brand-kit.module';
import { PlansModule } from './modules/plans/plans.module';
import { PostsModule } from './modules/posts/posts.module';
import { KiwifyModule } from './modules/kiwify/kiwify.module';
import { PhotosModule } from './modules/photos/photos.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting: diferentes limites por tipo de endpoint
    ThrottlerModule.forRoot([
      {
        name: 'short',    // 60 requests / 60 segundos (padrão)
        ttl: 60000,
        limit: 60,
      },
      {
        name: 'auth',     // 5 tentativas / 15 minutos para auth
        ttl: 900000,
        limit: 5,
      },
      {
        name: 'webhook',  // 100 / 1 hora para webhooks
        ttl: 3600000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    StorageModule,
    AiModule,
    QueuesModule,
    AuthModule,
    BrandKitModule,
    PlansModule,
    PostsModule,
    KiwifyModule,
    PhotosModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
