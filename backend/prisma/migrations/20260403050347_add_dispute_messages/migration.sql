-- CreateTable
CREATE TABLE "dispute_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dispute_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dispute_messages_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dispute_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "dispute_messages_dispute_id_idx" ON "dispute_messages"("dispute_id");

-- CreateIndex
CREATE INDEX "dispute_messages_user_id_idx" ON "dispute_messages"("user_id");

-- CreateIndex
CREATE INDEX "dispute_messages_created_at_idx" ON "dispute_messages"("created_at");
