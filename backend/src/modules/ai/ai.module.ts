import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { LogoOverlayService } from './logo-overlay.service';

@Global()
@Module({
  providers: [AiService, LogoOverlayService],
  exports: [AiService, LogoOverlayService],
})
export class AiModule {}
