import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostCategory, PostFormat } from '@prisma/client';

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  theme: string;

  @ApiProperty({ enum: PostCategory })
  @IsEnum(PostCategory)
  category: PostCategory;

  @ApiProperty({ enum: PostFormat })
  @IsEnum(PostFormat)
  format: PostFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userPhotoUrl?: string; // data URL (base64) de foto enviada pelo profissional
}
