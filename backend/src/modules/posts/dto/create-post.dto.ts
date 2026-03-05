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
  userPhotoUrl?: string; // foto do profissional (retrato)

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contextPhotoUrl?: string; // foto contextual (consultório, procedimento, etc.)

  @ApiPropertyOptional({ enum: ['fotografico', 'tipografico', 'grafico'] })
  @IsOptional()
  @IsString()
  carouselStyle?: 'fotografico' | 'tipografico' | 'grafico';
}
