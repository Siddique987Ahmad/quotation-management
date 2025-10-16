-- CreateEnum
CREATE TYPE "public"."EmailTemplateCategory" AS ENUM ('QUOTATION', 'INVOICE', 'USER', 'NOTIFICATION', 'MARKETING', 'SYSTEM', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."EmailTemplateType" AS ENUM ('QUOTATION_SENT', 'QUOTATION_APPROVED', 'QUOTATION_REJECTED', 'INVOICE_SENT', 'INVOICE_PAID', 'INVOICE_OVERDUE', 'USER_WELCOME', 'USER_PASSWORD_RESET', 'NOTIFICATION_SYSTEM', 'NOTIFICATION_REMINDER', 'CUSTOM');

-- CreateTable
CREATE TABLE "public"."email_templates" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."EmailTemplateCategory" NOT NULL DEFAULT 'CUSTOM',
    "type" "public"."EmailTemplateType" NOT NULL DEFAULT 'CUSTOM',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT,
    "sections" JSONB NOT NULL,
    "variables" JSONB NOT NULL,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_templateKey_key" ON "public"."email_templates"("templateKey");

-- CreateIndex
CREATE INDEX "email_templates_category_idx" ON "public"."email_templates"("category");

-- CreateIndex
CREATE INDEX "email_templates_type_idx" ON "public"."email_templates"("type");

-- CreateIndex
CREATE INDEX "email_templates_templateKey_idx" ON "public"."email_templates"("templateKey");

-- CreateIndex
CREATE INDEX "email_templates_enabled_idx" ON "public"."email_templates"("enabled");

-- AddForeignKey
ALTER TABLE "public"."email_templates" ADD CONSTRAINT "email_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_templates" ADD CONSTRAINT "email_templates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
