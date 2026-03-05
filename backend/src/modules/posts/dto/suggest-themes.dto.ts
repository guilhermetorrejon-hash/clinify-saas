import { IsEnum, IsOptional } from 'class-validator';
import { PostCategory, PostFormat } from '@prisma/client';

export class SuggestThemesDto {
  @IsOptional()
  @IsEnum(PostCategory)
  category?: PostCategory;

  @IsOptional()
  @IsEnum(PostFormat)
  format?: PostFormat;
}
