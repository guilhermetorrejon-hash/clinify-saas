-- Migração de dados: converter posts DICA_SAUDE para EDUCATIVO
UPDATE "posts" SET "category" = 'EDUCATIVO' WHERE "category" = 'DICA_SAUDE';

-- Recriar o enum PostCategory sem o valor DICA_SAUDE
ALTER TYPE "PostCategory" RENAME TO "PostCategory_old";
CREATE TYPE "PostCategory" AS ENUM ('EDUCATIVO', 'INSTITUCIONAL', 'MOTIVACIONAL', 'CRIATIVO_ANUNCIO');
ALTER TABLE "posts" ALTER COLUMN "category" TYPE "PostCategory" USING "category"::text::"PostCategory";
DROP TYPE "PostCategory_old";
