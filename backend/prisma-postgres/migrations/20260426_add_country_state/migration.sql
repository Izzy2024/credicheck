-- Add country, phone_country_code, state columns to credit_references
ALTER TABLE "credit_references" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'CO';
ALTER TABLE "credit_references" ADD COLUMN "phone_country_code" TEXT;
ALTER TABLE "credit_references" ADD COLUMN "state" TEXT;

-- Migrate existing department values to state column
UPDATE "credit_references" SET "state" = "department" WHERE "department" IS NOT NULL;

-- Drop the old department column
ALTER TABLE "credit_references" DROP COLUMN "department";

-- Add index on country
CREATE INDEX IF NOT EXISTS "credit_references_country_idx" ON "credit_references"("country");
