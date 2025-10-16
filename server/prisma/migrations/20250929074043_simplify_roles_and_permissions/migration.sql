/*
  Warnings:

  - You are about to drop the `custom_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_overrides` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permission_audit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."custom_permissions" DROP CONSTRAINT "custom_permissions_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."role_overrides" DROP CONSTRAINT "role_overrides_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."role_overrides" DROP CONSTRAINT "role_overrides_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."role_permission_audit" DROP CONSTRAINT "role_permission_audit_performedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."role_permission_audit" DROP CONSTRAINT "role_permission_audit_userId_fkey";

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "customPermissions" JSONB;

-- DropTable
DROP TABLE "public"."custom_permissions";

-- DropTable
DROP TABLE "public"."role_overrides";

-- DropTable
DROP TABLE "public"."role_permission_audit";
