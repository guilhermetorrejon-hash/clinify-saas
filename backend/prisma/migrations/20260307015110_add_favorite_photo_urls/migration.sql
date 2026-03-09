-- AlterTable
ALTER TABLE "professional_photos" ADD COLUMN     "favoritePhotoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
