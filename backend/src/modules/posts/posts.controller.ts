import { Body, Controller, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SuggestThemesDto } from './dto/suggest-themes.dto';

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post('suggest-themes')
  suggestThemes(@CurrentUser() user: any, @Body() dto: SuggestThemesDto) {
    return this.postsService.suggestThemes(user.id, dto);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.postsService.findAll(user.id);
  }

  /** Proxy público para download de imagens do R2 — evita bloqueio CORS no browser */
  /** DEVE ficar antes de @Get(':id') para não ser capturado como parâmetro */
  @Public()
  @Get('download-proxy')
  async downloadProxy(
    @Query('url') url: string,
    @Query('filename') filename: string,
    @Res() res: Response,
  ) {
    const r2PublicUrl = process.env.R2_PUBLIC_URL;

    if (!r2PublicUrl) {
      return res.status(403).send('Proxy não configurado');
    }

    try {
      const parsed = new URL(url);
      const allowed = new URL(r2PublicUrl);

      if (parsed.hostname !== allowed.hostname) {
        return res.status(403).send('URL não permitida');
      }

      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const hasValidExt = validExtensions.some(ext =>
        url.toLowerCase().endsWith(ext)
      );
      if (!hasValidExt) {
        return res.status(403).send('Tipo de arquivo não permitido');
      }

    } catch (e) {
      return res.status(400).send('URL inválida');
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) {
        return res.status(502).send('Erro ao buscar imagem');
      }
      const ct = response.headers.get('content-type') || 'image/jpeg';
      const buffer = Buffer.from(await response.arrayBuffer());
      res.set({
        'Content-Type': ct,
        'Content-Disposition': `attachment; filename="${filename || 'clinify-imagem.jpg'}"`,
        'Content-Length': buffer.length.toString(),
      });
      res.send(buffer);
    } catch (err) {
      res.status(502).send('Erro ao baixar imagem');
    }
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    return this.postsService.findOne(user.id, id);
  }

  @Get(':id/status')
  async getStatus(@CurrentUser() user: any, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    const post = await this.postsService.findOne(user.id, id);
    return {
      status: post.status,
      total: post.variations.length,
      completed: post.variations.filter((v: any) => v.imageUrl).length,
      variations: post.variations.map((v: any) => ({
        id: v.id,
        designStyle: v.designStyle,
        hasImage: !!v.imageUrl,
      })),
    };
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(user.id, id, dto);
  }

  @Post(':id/regenerate-texts')
  regenerateTexts(@CurrentUser() user: any, @Param('id') id: string) {
    return this.postsService.regenerateTexts(user.id, id);
  }

  @Post(':id/generate-images')
  generateImages(@CurrentUser() user: any, @Param('id') id: string) {
    return this.postsService.generateImages(user.id, id);
  }

  @Patch(':id/variations/:variationId/select')
  selectVariation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('variationId') variationId: string,
  ) {
    return this.postsService.selectVariation(user.id, id, variationId);
  }
}
