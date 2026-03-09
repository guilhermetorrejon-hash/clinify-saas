-- CreateEnum
CREATE TYPE "UsageType" AS ENUM ('POST', 'CAROUSEL', 'PHOTO', 'THEME_SUGGESTION', 'CAPTION_REWRITE');

-- AlterTable: adicionar novos campos ao plans (com defaults para não quebrar dados existentes)
ALTER TABLE "plans" ADD COLUMN "postsPerMonth" INTEGER NOT NULL DEFAULT 4;
ALTER TABLE "plans" ADD COLUMN "carouselsPerMonth" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "plans" ADD COLUMN "themeSuggestions" INTEGER NOT NULL DEFAULT 16;
ALTER TABLE "plans" ADD COLUMN "captionRewrites" INTEGER NOT NULL DEFAULT 12;

-- Migrar dados: converter postsPerWeek para postsPerMonth (x4 semanas)
UPDATE "plans" SET "postsPerMonth" = "postsPerWeek" * 4 WHERE "postsPerWeek" IS NOT NULL;

-- Agora sim, dropar a coluna antiga
ALTER TABLE "plans" DROP COLUMN "postsPerWeek";

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "UsageType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_records_userId_type_createdAt_idx" ON "usage_records"("userId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
