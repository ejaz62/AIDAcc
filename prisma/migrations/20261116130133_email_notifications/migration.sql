-- CreateEnum
CREATE TYPE "NotificationMode" AS ENUM ('NONE', 'INSTANT', 'DAILY');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'PREVIEW', 'FAILED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notificationMode" "NotificationMode" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "email_messages" (
    "id" TEXT NOT NULL,
    "kind" VARCHAR(40) NOT NULL,
    "to" VARCHAR(254) NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "html" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" VARCHAR(500),
    "provider" VARCHAR(20),
    "providerId" VARCHAR(100),
    "registrationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_messages_status_createdAt_idx" ON "email_messages"("status", "createdAt");

-- CreateIndex
CREATE INDEX "email_messages_registrationId_idx" ON "email_messages"("registrationId");

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "interest_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
