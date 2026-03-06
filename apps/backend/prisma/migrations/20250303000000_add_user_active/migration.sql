-- AlterTable: add active column to User (default true = ativo)
ALTER TABLE "User" ADD COLUMN "active" INTEGER NOT NULL DEFAULT 1;
