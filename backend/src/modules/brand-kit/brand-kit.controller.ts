import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BrandKitService } from './brand-kit.service';
import { UpdateBrandKitDto } from './dto/update-brand-kit.dto';

class UploadLogoDto {
  @IsString()
  logoUrl: string; // base64 data URL ou URL pública
}

@ApiTags('Brand Kit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('brand-kit')
export class BrandKitController {
  constructor(private brandKitService: BrandKitService) {}

  @Get()
  findMine(@CurrentUser() user: any) {
    return this.brandKitService.findByUser(user.id);
  }

  @Patch()
  update(@CurrentUser() user: any, @Body() dto: UpdateBrandKitDto) {
    return this.brandKitService.update(user.id, dto);
  }

  @Post('logo')
  uploadLogo(@CurrentUser() user: any, @Body() dto: UploadLogoDto) {
    return this.brandKitService.updateLogo(user.id, dto.logoUrl);
  }

  @Post('logo-white')
  uploadLogoWhite(@CurrentUser() user: any, @Body() dto: UploadLogoDto) {
    return this.brandKitService.updateLogoWhite(user.id, dto.logoUrl);
  }
}
