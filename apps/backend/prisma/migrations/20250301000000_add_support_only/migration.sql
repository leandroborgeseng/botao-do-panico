-- AlterTable User: add support_only (apenas contato de apoio)
ALTER TABLE "User" ADD COLUMN "support_only" INTEGER NOT NULL DEFAULT 0;
