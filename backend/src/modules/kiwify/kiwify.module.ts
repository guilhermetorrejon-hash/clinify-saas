import { Module } from '@nestjs/common';
import { KiwifyController } from './kiwify.controller';
import { KiwifyService } from './kiwify.service';

@Module({
  controllers: [KiwifyController],
  providers: [KiwifyService],
})
export class KiwifyModule {}
