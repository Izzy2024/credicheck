-- CreateTable
CREATE TABLE "record_verifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "record_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "record_verifications_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "credit_references" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "record_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "record_verifications_record_id_idx" ON "record_verifications"("record_id");

-- CreateIndex
CREATE INDEX "record_verifications_user_id_idx" ON "record_verifications"("user_id");

-- CreateIndex
CREATE INDEX "record_verifications_type_idx" ON "record_verifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "record_verifications_record_id_user_id_key" ON "record_verifications"("record_id", "user_id");
