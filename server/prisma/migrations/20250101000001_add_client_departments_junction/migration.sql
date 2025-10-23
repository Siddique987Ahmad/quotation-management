-- Create junction table for many-to-many relationship between clients and departments
CREATE TABLE "client_departments" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_departments_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE INDEX "client_departments_clientId_idx" ON "client_departments"("clientId");
CREATE INDEX "client_departments_departmentId_idx" ON "client_departments"("departmentId");

-- Create unique constraint to prevent duplicate assignments
CREATE UNIQUE INDEX "client_departments_client_department_key" ON "client_departments"("clientId", "departmentId");

-- Add foreign key constraints
ALTER TABLE "client_departments" ADD CONSTRAINT "client_departments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_departments" ADD CONSTRAINT "client_departments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data from clients.departmentId to the new junction table
INSERT INTO "client_departments" ("id", "clientId", "departmentId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as "id",
    "id" as "clientId",
    "departmentId" as "departmentId",
    "createdAt" as "createdAt",
    "updatedAt" as "updatedAt"
FROM "clients" 
WHERE "departmentId" IS NOT NULL;

-- Remove the old departmentId column and related constraints
ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "clients_departmentid_fkey";
DROP INDEX IF EXISTS "clients_departmentid_idx";
ALTER TABLE "clients" DROP COLUMN IF EXISTS "departmentId";
