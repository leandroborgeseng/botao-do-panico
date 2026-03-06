-- AlterTable User: add cpf and address fields
ALTER TABLE "User" ADD COLUMN "cpf" TEXT;
ALTER TABLE "User" ADD COLUMN "cep" TEXT;
ALTER TABLE "User" ADD COLUMN "street" TEXT;
ALTER TABLE "User" ADD COLUMN "number" TEXT;
ALTER TABLE "User" ADD COLUMN "complement" TEXT;
ALTER TABLE "User" ADD COLUMN "neighborhood" TEXT;
ALTER TABLE "User" ADD COLUMN "city" TEXT;
ALTER TABLE "User" ADD COLUMN "state" TEXT;

-- Backfill cpf for existing rows (use id for uniqueness)
UPDATE "User" SET "cpf" = "id" WHERE "cpf" IS NULL;

CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- AlterTable EmergencyContact: add cpf and contact_user_id
ALTER TABLE "EmergencyContact" ADD COLUMN "cpf" TEXT;
ALTER TABLE "EmergencyContact" ADD COLUMN "contact_user_id" TEXT;

-- Backfill cpf for existing contacts
UPDATE "EmergencyContact" SET "cpf" = '' WHERE "cpf" IS NULL;

-- SQLite does not support ADD CONSTRAINT; we add the reference via a new table or skip FK.
-- Prisma will enforce the relation. Create index for contact_user_id.
CREATE INDEX "EmergencyContact_contact_user_id_idx" ON "EmergencyContact"("contact_user_id");
