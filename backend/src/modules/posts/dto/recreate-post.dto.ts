import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostFormat } from '@prisma/client';

export class RecreatePostDto {
  @ApiProperty({ description: 'Imagem do post original em base64 (data URL)' })
  @IsString()
  originalImageDataUrl: string;

  @ApiProperty({ enum: ['FEED', 'PORTRAIT', 'STORIES'] })
  @IsEnum(PostFormat)
  format: PostFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userPhotoUrl?: string;
}
