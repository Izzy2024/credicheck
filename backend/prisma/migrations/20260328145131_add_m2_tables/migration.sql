/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `credit_references` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "details" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "token_blacklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "token_blacklist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "app_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL,
    "updated_by" TEXT,
    CONSTRAINT "app_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
    "deleted_at" DATETIME,
    CONSTRAINT "credit_references_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_credit_references" ("address", "birth_date", "city", "created_at", "created_by", "creditor_name", "debt_amount", "debt_date", "debt_status", "deleted_at", "department", "email", "full_name", "id", "id_number", "id_type", "notes", "phone", "updated_at") SELECT "address", "birth_date", "city", "created_at", "created_by", "creditor_name", "debt_amount", "debt_date", "debt_status", "deleted_at", "department", "email", "full_name", "id", "id_number", "id_type", "notes", "phone", "updated_at" FROM "credit_references";
DROP TABLE "credit_references";
ALTER TABLE "new_credit_references" RENAME TO "credit_references";
CREATE INDEX "credit_references_full_name_idx" ON "credit_references"("full_name");
CREATE INDEX "credit_references_id_number_idx" ON "credit_references"("id_number");
CREATE INDEX "credit_references_id_type_idx" ON "credit_references"("id_type");
CREATE INDEX "credit_references_debt_status_idx" ON "credit_references"("debt_status");
CREATE INDEX "credit_references_created_at_idx" ON "credit_references"("created_at");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ANALYST',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" DATETIME,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("created_at", "deleted_at", "email", "first_name", "id", "is_active", "last_login", "last_name", "password_hash", "role", "updated_at") SELECT "created_at", "deleted_at", "email", "first_name", "id", "is_active", "last_login", "last_name", "password_hash", "role", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "token_blacklist_token_hash_key" ON "token_blacklist"("token_hash");

-- CreateIndex
CREATE INDEX "token_blacklist_token_hash_idx" ON "token_blacklist"("token_hash");

-- CreateIndex
CREATE INDEX "token_blacklist_expires_at_idx" ON "token_blacklist"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "app_config_key_key" ON "app_config"("key");
