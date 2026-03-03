import { IsEnum } from 'class-validator';
import { PostCategory, PostFormat } from '@prisma/client';

export class SuggestThemesDto {
  @IsEnum(PostCategory)
  category: PostCategory;

  @IsEnum(PostFormat)
  format: PostFormat;
}
