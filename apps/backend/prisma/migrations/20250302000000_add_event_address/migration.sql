-- AlterTable PanicEvent: add address fields (geocoding reversa)
ALTER TABLE "PanicEvent" ADD COLUMN "address_street" TEXT;
ALTER TABLE "PanicEvent" ADD COLUMN "address_neighborhood" TEXT;
ALTER TABLE "PanicEvent" ADD COLUMN "address_city" TEXT;
ALTER TABLE "PanicEvent" ADD COLUMN "address_state" TEXT;
