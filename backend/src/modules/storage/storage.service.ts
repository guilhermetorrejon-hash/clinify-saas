import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
    this.bucket = process.env.R2_BUCKET_NAME || 'clinify-uploads';
    this.publicUrl = process.env.R2_PUBLIC_URL || '';
  }

  async uploadBase64Image(base64: string, mimeType: string, folder: string): Promise<string> {
    // Se R2 não estiver configurado, retorna data URL (modo dev)
    if (!process.env.R2_ACCOUNT_ID) {
      this.logger.warn('R2 não configurado — salvando como data URL (modo desenvolvimento)');
      return `data:${mimeType};base64,${base64}`;
    }

    const buffer = Buffer.from(base64, 'base64');
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    const key = `${folder}/${randomUUID()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000',
      }),
    );

    const url = `${this.publicUrl}/${key}`;
    this.logger.log(`Imagem salva: ${url}`);
    return url;
  }

  async uploadBuffer(buffer: Buffer, mimeType: string, folder: string): Promise<string> {
    // Se R2 não estiver configurado, retorna data URL (modo dev)
    if (!process.env.R2_ACCOUNT_ID) {
      this.logger.warn('R2 não configurado — salvando como data URL (modo desenvolvimento)');
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    const key = `${folder}/${randomUUID()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000',
      }),
    );

    const url = `${this.publicUrl}/${key}`;
    this.logger.log(`Imagem salva: ${url}`);
    return url;
  }
}
