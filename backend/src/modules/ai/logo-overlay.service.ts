import { Injectable, Logger } from '@nestjs/common';

export interface LogoOverlayOptions {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  padding?: number;
  maxWidth?: number;
}

@Injectable()
export class LogoOverlayService {
  private readonly logger = new Logger(LogoOverlayService.name);
  private sharpModule: any = null;
  private sharpLoaded = false;

  private async getSharp(): Promise<any> {
    if (this.sharpLoaded) return this.sharpModule;
    this.sharpLoaded = true;
    try {
      this.sharpModule = (await import('sharp')).default;
      this.logger.log('Sharp carregado com sucesso');
    } catch (err: any) {
      this.logger.warn(`Sharp não disponível — logo overlay desabilitado: ${err.message}`);
      this.sharpModule = null;
    }
    return this.sharpModule;
  }

  async applyLogo(
    imageBase64: string,
    logoSource: string,
    options: LogoOverlayOptions = {},
  ): Promise<string> {
    const { position = 'top-left', padding = 30, maxWidth = 120 } = options;

    const sharp = await this.getSharp();
    if (!sharp) return imageBase64;

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

      const resizedLogo = await sharp(logoBuffer)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .png()
        .toBuffer();

      const logoMeta = await sharp(resizedLogo).metadata();
      const logoW = logoMeta.width || maxWidth;
      const logoH = logoMeta.height || maxWidth;

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
        default:
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

  /**
   * Remove bordas brancas/cinza claras ao redor da imagem gerada pelo Gemini.
   * Detecta se há faixas uniformes claras nas bordas e recorta, depois redimensiona ao tamanho original.
   */
  async trimWhiteBorders(imageBase64: string, targetWidth: number, targetHeight: number): Promise<string> {
    const sharp = await this.getSharp();
    if (!sharp) return imageBase64;

    try {
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const metadata = await sharp(imageBuffer).metadata();
      if (!metadata.width || !metadata.height) return imageBase64;

      // Extrai pixels da borda para verificar se são brancos/cinza claro
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

      const w = info.width;
      const h = info.height;
      const channels = info.channels;
      const THRESHOLD = 240; // Pixels com R,G,B > 240 são considerados "brancos"
      const MIN_BORDER = 3; // Mínimo de pixels de borda para considerar como borda indesejada

      const isWhitePixel = (x: number, y: number): boolean => {
        const idx = (y * w + x) * channels;
        return data[idx] > THRESHOLD && data[idx + 1] > THRESHOLD && data[idx + 2] > THRESHOLD;
      };

      // Detecta bordas — verifica se linhas/colunas inteiras são brancas
      let top = 0, bottom = 0, left = 0, right = 0;

      // Borda superior
      for (let y = 0; y < Math.min(h * 0.1, 80); y++) {
        let allWhite = true;
        for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 20))) {
          if (!isWhitePixel(x, y)) { allWhite = false; break; }
        }
        if (allWhite) top = y + 1; else break;
      }

      // Borda inferior
      for (let y = h - 1; y > h - Math.min(h * 0.1, 80); y--) {
        let allWhite = true;
        for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 20))) {
          if (!isWhitePixel(x, y)) { allWhite = false; break; }
        }
        if (allWhite) bottom = h - y; else break;
      }

      // Borda esquerda
      for (let x = 0; x < Math.min(w * 0.1, 80); x++) {
        let allWhite = true;
        for (let y = 0; y < h; y += Math.max(1, Math.floor(h / 20))) {
          if (!isWhitePixel(x, y)) { allWhite = false; break; }
        }
        if (allWhite) left = x + 1; else break;
      }

      // Borda direita
      for (let x = w - 1; x > w - Math.min(w * 0.1, 80); x--) {
        let allWhite = true;
        for (let y = 0; y < h; y += Math.max(1, Math.floor(h / 20))) {
          if (!isWhitePixel(x, y)) { allWhite = false; break; }
        }
        if (allWhite) right = w - x; else break;
      }

      if (top < MIN_BORDER && bottom < MIN_BORDER && left < MIN_BORDER && right < MIN_BORDER) {
        return imageBase64; // Sem bordas brancas detectadas
      }

      this.logger.log(`Bordas brancas detectadas: top=${top} bottom=${bottom} left=${left} right=${right} — recortando e redimensionando`);

      const cropWidth = w - left - right;
      const cropHeight = h - top - bottom;

      if (cropWidth < w * 0.7 || cropHeight < h * 0.7) {
        this.logger.warn('Bordas detectadas muito grandes (>30% da imagem) — ignorando trim para segurança');
        return imageBase64;
      }

      const result = await sharp(imageBuffer)
        .extract({ left, top, width: cropWidth, height: cropHeight })
        .resize(targetWidth, targetHeight, { fit: 'fill' })
        .toBuffer();

      return result.toString('base64');
    } catch (err: any) {
      this.logger.error(`Erro ao trimmar bordas: ${err.message}`);
      return imageBase64;
    }
  }

  /**
   * Converte uma logo para branca, preservando a transparência/forma.
   * Útil quando o usuário não subiu uma versão branca da logo.
   */
  async makeLogoWhite(logoSource: string): Promise<string | null> {
    const sharp = await this.getSharp();
    if (!sharp) return null;

    try {
      const logoBuffer = await this.resolveLogoBuffer(logoSource);
      if (!logoBuffer) return null;

      // Converte todos os pixels não-transparentes para branco
      const metadata = await sharp(logoBuffer).metadata();
      const { data, info } = await sharp(logoBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Percorre cada pixel: se tem opacidade, torna branco
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 0) {
          data[i] = 255;     // R
          data[i + 1] = 255; // G
          data[i + 2] = 255; // B
          // mantém alpha original
        }
      }

      const whiteLogoBuffer = await sharp(data, {
        raw: { width: info.width, height: info.height, channels: 4 },
      })
        .png()
        .toBuffer();

      this.logger.log('Logo convertida para branca automaticamente');
      return `data:image/png;base64,${whiteLogoBuffer.toString('base64')}`;
    } catch (err: any) {
      this.logger.error(`Erro ao converter logo para branca: ${err.message}`);
      return null;
    }
  }

  private async resolveLogoBuffer(logoSource: string): Promise<Buffer | null> {
    const dataUrlMatch = logoSource.match(/^data:[^;]+;base64,(.+)$/);
    if (dataUrlMatch) {
      return Buffer.from(dataUrlMatch[1], 'base64');
    }

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
