-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_credit_references" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "full_name" TEXT NOT NULL,
    "id_number" TEXT NOT NULL,
    "id_type" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'default',
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
    "case_type" TEXT NOT NULL DEFAULT 'FORMAL',
    "publish_state" TEXT NOT NULL DEFAULT 'PENDING_AUTOMATION',
    "review_status" TEXT NOT NULL DEFAULT 'PENDING',
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "risk_reasons" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" DATETIME,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "credit_references_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_credit_references" ("address", "birth_date", "case_type", "city", "created_at", "created_by", "creditor_name", "debt_amount", "debt_date", "debt_status", "deleted_at", "department", "email", "full_name", "id", "id_number", "id_type", "notes", "phone", "publish_state", "review_status", "reviewed_at", "reviewed_by", "risk_reasons", "risk_score", "updated_at") SELECT "address", "birth_date", "case_type", "city", "created_at", "created_by", "creditor_name", "debt_amount", "debt_date", "debt_status", "deleted_at", "department", "email", "full_name", "id", "id_number", "id_type", "notes", "phone", "publish_state", "review_status", "reviewed_at", "reviewed_by", "risk_reasons", "risk_score", "updated_at" FROM "credit_references";
DROP TABLE "credit_references";
ALTER TABLE "new_credit_references" RENAME TO "credit_references";
CREATE INDEX "credit_references_full_name_idx" ON "credit_references"("full_name");
CREATE INDEX "credit_references_id_number_idx" ON "credit_references"("id_number");
CREATE INDEX "credit_references_id_type_idx" ON "credit_references"("id_type");
CREATE INDEX "credit_references_tenant_id_idx" ON "credit_references"("tenant_id");
CREATE INDEX "credit_references_tenant_id_created_at_idx" ON "credit_references"("tenant_id", "created_at");
CREATE INDEX "credit_references_debt_status_idx" ON "credit_references"("debt_status");
CREATE INDEX "credit_references_created_at_idx" ON "credit_references"("created_at");
CREATE TABLE "new_search_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'default',
    "search_type" TEXT NOT NULL,
    "search_term" TEXT NOT NULL,
    "results_count" INTEGER NOT NULL DEFAULT 0,
    "execution_time_ms" INTEGER NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_search_history" ("created_at", "execution_time_ms", "id", "ip_address", "results_count", "search_term", "search_type", "user_agent", "user_id") SELECT "created_at", "execution_time_ms", "id", "ip_address", "results_count", "search_term", "search_type", "user_agent", "user_id" FROM "search_history";
DROP TABLE "search_history";
ALTER TABLE "new_search_history" RENAME TO "search_history";
CREATE INDEX "search_history_user_id_idx" ON "search_history"("user_id");
CREATE INDEX "search_history_tenant_id_idx" ON "search_history"("tenant_id");
CREATE INDEX "search_history_tenant_id_user_id_idx" ON "search_history"("tenant_id", "user_id");
CREATE INDEX "search_history_search_type_idx" ON "search_history"("search_type");
CREATE INDEX "search_history_created_at_idx" ON "search_history"("created_at");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ANALYST',
    "tenant_id" TEXT NOT NULL DEFAULT 'default',
    "trust_level" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" DATETIME,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("created_at", "deleted_at", "email", "first_name", "id", "is_active", "last_login", "last_name", "password_hash", "role", "trust_level", "updated_at") SELECT "created_at", "deleted_at", "email", "first_name", "id", "is_active", "last_login", "last_name", "password_hash", "role", "trust_level", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
