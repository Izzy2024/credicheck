-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_credit_references" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "full_name" TEXT NOT NULL,
    "id_number" TEXT NOT NULL,
    "id_type" TEXT NOT NULL,
    "birth_date" DATETIME,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "department" TEXT,
    "debt_amount" DECIMAL NOT NULL,
    "debt_date" DATETIME NOT NULL,
    "creditor_name" TEXT NOT NULL,
    "debt_status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "credit_references_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_credit_references" ("address", "birth_date", "city", "created_at", "created_by", "creditor_name", "debt_amount", "debt_date", "debt_status", "department", "email", "full_name", "id", "id_number", "id_type", "notes", "phone", "updated_at") SELECT "address", "birth_date", "city", "created_at", "created_by", "creditor_name", "debt_amount", "debt_date", "debt_status", "department", "email", "full_name", "id", "id_number", "id_type", "notes", "phone", "updated_at" FROM "credit_references";
DROP TABLE "credit_references";
ALTER TABLE "new_credit_references" RENAME TO "credit_references";
CREATE INDEX "credit_references_full_name_idx" ON "credit_references"("full_name");
CREATE INDEX "credit_references_id_number_idx" ON "credit_references"("id_number");
CREATE INDEX "credit_references_id_type_idx" ON "credit_references"("id_type");
CREATE INDEX "credit_references_debt_status_idx" ON "credit_references"("debt_status");
CREATE INDEX "credit_references_created_at_idx" ON "credit_references"("created_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
