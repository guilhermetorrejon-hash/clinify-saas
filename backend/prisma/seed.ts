import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.upsert({
    where: { slug: 'starter' },
    update: {},
    create: {
      name: 'Starter',
      slug: 'starter',
      priceInCents: 4700,
      postsPerWeek: 2,
      photosPerMonth: 4,
    },
  });

  await prisma.plan.upsert({
    where: { slug: 'pro' },
    update: {},
    create: {
      name: 'Pro',
      slug: 'pro',
      priceInCents: 9700,
      postsPerWeek: 3,
      photosPerMonth: 6,
    },
  });

  await prisma.plan.upsert({
    where: { slug: 'expert' },
    update: {},
    create: {
      name: 'Expert',
      slug: 'expert',
      priceInCents: 19700,
      postsPerWeek: 4,
      photosPerMonth: 8,
    },
  });

  console.log('✅ Planos criados com sucesso');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
