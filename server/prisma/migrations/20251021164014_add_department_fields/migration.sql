-- AlterTable
ALTER TABLE "public"."departments" ADD COLUMN "contactPerson" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "zipCode" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "taxId" TEXT,
ADD COLUMN "customFields" JSONB,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
