import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Desativar planos antigos (se existirem)
  await prisma.plan.updateMany({
    where: { slug: { in: ['starter', 'pro', 'expert'] } },
    data: { isActive: false },
  });

  // Plano gratuito — atribuído automaticamente no cadastro
  await prisma.plan.upsert({
    where: { slug: 'gratuito' },
    update: {
      name: 'Gratuito',
      postsPerMonth: 2,
      carouselsPerMonth: 0,
      photosPerMonth: 1,
      themeSuggestions: 5,
      captionRewrites: 2,
      priceInCents: 0,
      isActive: true,
    },
    create: {
      name: 'Gratuito',
      slug: 'gratuito',
      postsPerMonth: 2,
      carouselsPerMonth: 0,
      photosPerMonth: 1,
      themeSuggestions: 5,
      captionRewrites: 2,
      priceInCents: 0,
    },
  });

  await prisma.plan.upsert({
    where: { slug: 'essencial' },
    update: {
      name: 'Essencial',
      postsPerMonth: 4,
      carouselsPerMonth: 1,
      photosPerMonth: 4,
      themeSuggestions: 16,
      captionRewrites: 12,
      priceInCents: 4900,
      isActive: true,
    },
    create: {
      name: 'Essencial',
      slug: 'essencial',
      postsPerMonth: 4,
      carouselsPerMonth: 1,
      photosPerMonth: 4,
      themeSuggestions: 16,
      captionRewrites: 12,
      priceInCents: 4900,
    },
  });

  await prisma.plan.upsert({
    where: { slug: 'profissional' },
    update: {
      name: 'Profissional',
      postsPerMonth: 8,
      carouselsPerMonth: 2,
      photosPerMonth: 6,
      themeSuggestions: 32,
      captionRewrites: 24,
      priceInCents: 9900,
      isActive: true,
    },
    create: {
      name: 'Profissional',
      slug: 'profissional',
      postsPerMonth: 8,
      carouselsPerMonth: 2,
      photosPerMonth: 6,
      themeSuggestions: 32,
      captionRewrites: 24,
      priceInCents: 9900,
    },
  });

  await prisma.plan.upsert({
    where: { slug: 'referencia' },
    update: {
      name: 'Referência',
      postsPerMonth: 12,
      carouselsPerMonth: 4,
      photosPerMonth: 10,
      themeSuggestions: 48,
      captionRewrites: 36,
      priceInCents: 19900,
      isActive: true,
    },
    create: {
      name: 'Referência',
      slug: 'referencia',
      postsPerMonth: 12,
      carouselsPerMonth: 4,
      photosPerMonth: 10,
      themeSuggestions: 48,
      captionRewrites: 36,
      priceInCents: 19900,
    },
  });

  console.log('Planos criados/atualizados com sucesso');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
