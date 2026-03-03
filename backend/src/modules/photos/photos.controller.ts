import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PhotosService } from './photos.service';
import { StartPhotoSessionDto } from './dto/start-photo-session.dto';

@ApiTags('Photos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post('start')
  start(@CurrentUser() user: any, @Body() dto: StartPhotoSessionDto) {
    return this.photosService.startSession(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.photosService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.photosService.findOne(user.id, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.photosService.deleteSession(user.id, id);
  }
}
