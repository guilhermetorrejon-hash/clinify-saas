import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface LogoOverlayOptions {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  padding?: number;
  maxWidth?: number;
}

@Injectable()
export class LogoOverlayService {
  private readonly logger = new Logger(LogoOverlayService.name);

  /**
   * Sobrepõe a logo real sobre a imagem gerada pela IA.
   * @param imageBase64 - Imagem base (base64 puro, sem prefixo data:)
   * @param logoSource - Logo como data URL (data:image/...) ou URL HTTP
   * @param options - Posição, padding e tamanho máximo
   * @returns Base64 da imagem final (sem prefixo data:)
   */
  async applyLogo(
    imageBase64: string,
    logoSource: string,
    options: LogoOverlayOptions = {},
  ): Promise<string> {
    const { position = 'top-left', padding = 30, maxWidth = 120 } = options;

    try {
      const logoBuffer = await this.resolveLogoBuffer(logoSource);
      if (!logoBuffer) {
        this.logger.warn('Não foi possível resolver a logo — retornando imagem sem overlay');
        return imageBase64;
      }

      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const imageMetadata = await sharp(imageBuffer).metadata();
      const imgWidth = imageMetadata.width || 1080;
      const imgHeight = imageMetadata.height || 1080;

      // Redimensionar logo para maxWidth mantendo proporção
      const resizedLogo = await sharp(logoBuffer)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .png()
        .toBuffer();

      const logoMeta = await sharp(resizedLogo).metadata();
      const logoW = logoMeta.width || maxWidth;
      const logoH = logoMeta.height || maxWidth;

      // Calcular posição
      let left: number;
      let top: number;
      switch (position) {
        case 'top-right':
          left = imgWidth - logoW - padding;
          top = padding;
          break;
        case 'bottom-left':
          left = padding;
          top = imgHeight - logoH - padding;
          break;
        case 'bottom-right':
          left = imgWidth - logoW - padding;
          top = imgHeight - logoH - padding;
          break;
        default: // top-left
          left = padding;
          top = padding;
      }

      const result = await sharp(imageBuffer)
        .composite([{ input: resizedLogo, left, top }])
        .toBuffer();

      this.logger.log(`Logo overlay aplicado (${position}, ${logoW}x${logoH}px)`);
      return result.toString('base64');
    } catch (err: any) {
      this.logger.error(`Erro ao aplicar logo overlay: ${err.message}`, err.stack);
      return imageBase64;
    }
  }

  private async resolveLogoBuffer(logoSource: string): Promise<Buffer | null> {
    // Data URL: data:image/png;base64,...
    const dataUrlMatch = logoSource.match(/^data:[^;]+;base64,(.+)$/);
    if (dataUrlMatch) {
      return Buffer.from(dataUrlMatch[1], 'base64');
    }

    // URL HTTP/HTTPS
    if (logoSource.startsWith('http://') || logoSource.startsWith('https://')) {
      try {
        const response = await fetch(logoSource);
        if (!response.ok) {
          this.logger.warn(`Falha ao buscar logo (${response.status}): ${logoSource}`);
          return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } catch (err: any) {
        this.logger.warn(`Erro ao buscar logo por URL: ${err.message}`);
        return null;
      }
    }

    this.logger.warn(`Formato de logo não reconhecido: ${logoSource.substring(0, 50)}...`);
    return null;
  }
}
