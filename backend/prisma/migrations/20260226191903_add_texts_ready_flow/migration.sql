-- AlterEnum
ALTER TYPE "PostStatus" ADD VALUE 'TEXTS_READY';

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "headline" TEXT,
ADD COLUMN     "subtitle" TEXT;
