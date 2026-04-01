-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'analyst',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "credit_references" (
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
    "debt_status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "credit_references_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "search_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "search_type" TEXT NOT NULL,
    "search_term" TEXT NOT NULL,
    "results_count" INTEGER NOT NULL DEFAULT 0,
    "execution_time_ms" INTEGER NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "credit_references_full_name_idx" ON "credit_references"("full_name");

-- CreateIndex
CREATE INDEX "credit_references_id_number_idx" ON "credit_references"("id_number");

-- CreateIndex
CREATE INDEX "credit_references_id_type_idx" ON "credit_references"("id_type");

-- CreateIndex
CREATE INDEX "credit_references_debt_status_idx" ON "credit_references"("debt_status");

-- CreateIndex
CREATE INDEX "credit_references_created_at_idx" ON "credit_references"("created_at");

-- CreateIndex
CREATE INDEX "search_history_user_id_idx" ON "search_history"("user_id");

-- CreateIndex
CREATE INDEX "search_history_search_type_idx" ON "search_history"("search_type");

-- CreateIndex
CREATE INDEX "search_history_created_at_idx" ON "search_history"("created_at");
