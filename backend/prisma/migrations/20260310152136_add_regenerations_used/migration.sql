-- AlterTable
ALTER TABLE "plans" ALTER COLUMN "photosPerMonth" SET DEFAULT 4;

-- AlterTable
ALTER TABLE "professional_photos" ADD COLUMN     "regenerationsUsed" INTEGER NOT NULL DEFAULT 0;
