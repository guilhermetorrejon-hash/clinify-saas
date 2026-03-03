/*
  Warnings:

  - You are about to drop the column `generatedPhotoUrl` on the `professional_photos` table. All the data in the column will be lost.
  - You are about to drop the column `style` on the `professional_photos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "professional_photos" DROP COLUMN "generatedPhotoUrl",
DROP COLUMN "style",
ADD COLUMN     "generatedPhotoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "loraUrl" TEXT,
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'GENERATE';
