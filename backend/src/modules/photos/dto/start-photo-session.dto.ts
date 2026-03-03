import { IsArray, IsIn, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class StartPhotoSessionDto {
  @IsIn(['GENERATE', 'UPLOAD'])
  mode: 'GENERATE' | 'UPLOAD';

  // Base64 data URLs das fotos (ex: "data:image/jpeg;base64,...")
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  photos: string[];
}
