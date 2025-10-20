-- Create departments table
CREATE TABLE IF NOT EXISTS "departments" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed a default department with a stable UUID (idempotent on name)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "departments" WHERE name = 'General') THEN
    INSERT INTO "departments" ("id","name")
    VALUES ('00000000-0000-0000-0000-000000000001','General');
  END IF;
END$$;

-- Add departmentId column to clients if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='clients' AND column_name='departmentId'
  ) THEN
    ALTER TABLE "clients" ADD COLUMN "departmentId" TEXT;
  END IF;
END$$;

-- Backfill existing rows to default department
UPDATE "clients" 
SET "departmentId" = '00000000-0000-0000-0000-000000000001'
WHERE "departmentId" IS NULL;

-- Add FK if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='clients' AND constraint_name='clients_departmentId_fkey'
  ) THEN
    ALTER TABLE "clients"
      ADD CONSTRAINT clients_departmentId_fkey 
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END$$;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS clients_departmentId_idx ON "clients"("departmentId");

-- Finally, enforce NOT NULL (safe after backfill)
ALTER TABLE "clients" ALTER COLUMN "departmentId" SET NOT NULL;


