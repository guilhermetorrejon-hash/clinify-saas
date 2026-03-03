-- AlterTable
ALTER TABLE "brand_kits" ADD COLUMN     "areasOfExpertise" TEXT[] DEFAULT ARRAY[]::TEXT[];
