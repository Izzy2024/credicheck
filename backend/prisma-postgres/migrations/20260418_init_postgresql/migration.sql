-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'PAID', 'INACTIVE', 'PAYMENT_PLAN', 'DISPUTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_RECORD_MATCH', 'SEARCH_MATCH', 'STATUS_CHANGE', 'DISPUTE_UPDATE');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('CONFIRMED', 'DISPUTED', 'ADDITIONAL_INFO');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PublishState" AS ENUM ('DRAFT', 'PENDING_AUTOMATION', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'UNDER_DISPUTE');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'AUTO_APPROVED', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ANALYST',
    "tenant_id" TEXT NOT NULL DEFAULT 'default',
    "trust_level" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_references" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "id_number" TEXT NOT NULL,
    "id_type" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'default',
    "birth_date" TIMESTAMP(3),
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "department" TEXT,
    "debt_amount" DECIMAL(65,30) NOT NULL,
    "debt_date" TIMESTAMP(3) NOT NULL,
    "creditor_name" TEXT NOT NULL,
    "debt_status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "case_type" TEXT NOT NULL DEFAULT 'FORMAL',
    "publish_state" "PublishState" NOT NULL DEFAULT 'PENDING_AUTOMATION',
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "risk_reasons" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "credit_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT 'default',
    "search_type" TEXT NOT NULL,
    "search_term" TEXT NOT NULL,
    "results_count" INTEGER NOT NULL DEFAULT 0,
    "execution_time_ms" INTEGER NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "details" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_blacklist" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "watch_type" TEXT NOT NULL,
    "watch_value" TEXT NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "related_record_id" TEXT,
    "related_search_id" TEXT,
    "metadata" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record_verifications" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "VerificationType" NOT NULL,
    "confidence" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "record_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
    "admin_notes" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_messages" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_attachments" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "credit_references_full_name_idx" ON "credit_references"("full_name");

-- CreateIndex
CREATE INDEX "credit_references_id_number_idx" ON "credit_references"("id_number");

-- CreateIndex
CREATE INDEX "credit_references_id_type_idx" ON "credit_references"("id_type");

-- CreateIndex
CREATE INDEX "credit_references_tenant_id_idx" ON "credit_references"("tenant_id");

-- CreateIndex
CREATE INDEX "credit_references_tenant_id_created_at_idx" ON "credit_references"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "credit_references_debt_status_idx" ON "credit_references"("debt_status");

-- CreateIndex
CREATE INDEX "credit_references_created_at_idx" ON "credit_references"("created_at");

-- CreateIndex
CREATE INDEX "search_history_user_id_idx" ON "search_history"("user_id");

-- CreateIndex
CREATE INDEX "search_history_tenant_id_idx" ON "search_history"("tenant_id");

-- CreateIndex
CREATE INDEX "search_history_tenant_id_user_id_idx" ON "search_history"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "search_history_search_type_idx" ON "search_history"("search_type");

-- CreateIndex
CREATE INDEX "search_history_created_at_idx" ON "search_history"("created_at");

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

-- CreateIndex
CREATE INDEX "watchlist_items_user_id_idx" ON "watchlist_items"("user_id");

-- CreateIndex
CREATE INDEX "watchlist_items_watch_type_watch_value_idx" ON "watchlist_items"("watch_type", "watch_value");

-- CreateIndex
CREATE INDEX "watchlist_items_is_active_idx" ON "watchlist_items"("is_active");

-- CreateIndex
CREATE INDEX "notifications_user_id_status_idx" ON "notifications"("user_id", "status");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "record_verifications_record_id_idx" ON "record_verifications"("record_id");

-- CreateIndex
CREATE INDEX "record_verifications_user_id_idx" ON "record_verifications"("user_id");

-- CreateIndex
CREATE INDEX "record_verifications_type_idx" ON "record_verifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "record_verifications_record_id_user_id_key" ON "record_verifications"("record_id", "user_id");

-- CreateIndex
CREATE INDEX "disputes_record_id_idx" ON "disputes"("record_id");

-- CreateIndex
CREATE INDEX "disputes_user_id_idx" ON "disputes"("user_id");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "disputes_created_at_idx" ON "disputes"("created_at");

-- CreateIndex
CREATE INDEX "dispute_messages_dispute_id_idx" ON "dispute_messages"("dispute_id");

-- CreateIndex
CREATE INDEX "dispute_messages_user_id_idx" ON "dispute_messages"("user_id");

-- CreateIndex
CREATE INDEX "dispute_messages_created_at_idx" ON "dispute_messages"("created_at");

-- CreateIndex
CREATE INDEX "dispute_attachments_dispute_id_idx" ON "dispute_attachments"("dispute_id");

-- CreateIndex
CREATE INDEX "dispute_attachments_uploaded_by_id_idx" ON "dispute_attachments"("uploaded_by_id");

-- AddForeignKey
ALTER TABLE "credit_references" ADD CONSTRAINT "credit_references_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_blacklist" ADD CONSTRAINT "token_blacklist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_config" ADD CONSTRAINT "app_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_verifications" ADD CONSTRAINT "record_verifications_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "credit_references"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_verifications" ADD CONSTRAINT "record_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_attachments" ADD CONSTRAINT "dispute_attachments_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_attachments" ADD CONSTRAINT "dispute_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

