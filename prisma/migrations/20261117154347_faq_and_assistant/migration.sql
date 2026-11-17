-- CreateTable
CREATE TABLE "faq_entries" (
    "id" TEXT NOT NULL,
    "question" VARCHAR(300) NOT NULL,
    "answer" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_conversations" (
    "id" TEXT NOT NULL,
    "ipHash" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" VARCHAR(10) NOT NULL,
    "content" TEXT NOT NULL,
    "source" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faq_entries_status_sortOrder_idx" ON "faq_entries"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "assistant_conversations_createdAt_idx" ON "assistant_conversations"("createdAt");

-- CreateIndex
CREATE INDEX "assistant_conversations_ipHash_createdAt_idx" ON "assistant_conversations"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "assistant_messages_conversationId_createdAt_idx" ON "assistant_messages"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "assistant_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
