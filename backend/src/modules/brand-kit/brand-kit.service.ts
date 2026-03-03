import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateBrandKitDto } from './dto/update-brand-kit.dto';

@Injectable()
export class BrandKitService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string) {
    const brandKit = await this.prisma.brandKit.findUnique({
      where: { userId },
    });
    if (!brandKit) throw new NotFoundException('Brand kit não encontrado');
    return brandKit;
  }

  async update(userId: string, dto: UpdateBrandKitDto) {
    return this.prisma.brandKit.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  async updateLogo(userId: string, logoUrl: string) {
    return this.prisma.brandKit.upsert({
      where: { userId },
      create: { userId, logoUrl },
      update: { logoUrl },
    });
  }

  async updateLogoWhite(userId: string, logoWhiteUrl: string) {
    return this.prisma.brandKit.upsert({
      where: { userId },
      create: { userId, logoWhiteUrl },
      update: { logoWhiteUrl },
    });
  }

  async updateProfilePhoto(userId: string, photoUrl: string) {
    return this.prisma.brandKit.update({
      where: { userId },
      data: { profilePhotoUrl: photoUrl },
    });
  }
}
