-- CreateEnum
CREATE TYPE "LearnerType" AS ENUM ('STUDENT', 'PROFESSIONAL', 'EDUCATOR', 'ORGANISATION', 'OTHER');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('NEW', 'CONTACTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "interest_registrations" (
    "id" TEXT NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "learnerType" "LearnerType" NOT NULL,
    "message" VARCHAR(1000),
    "consentAt" TIMESTAMP(3) NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'NEW',
    "submissionCount" INTEGER NOT NULL DEFAULT 1,
    "lastSubmittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interest_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_attempts" (
    "id" TEXT NOT NULL,
    "formToken" VARCHAR(64) NOT NULL,
    "ipHash" CHAR(64) NOT NULL,
    "outcome" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "interest_registrations_email_key" ON "interest_registrations"("email");

-- CreateIndex
CREATE INDEX "interest_registrations_createdAt_idx" ON "interest_registrations"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "submission_attempts_formToken_key" ON "submission_attempts"("formToken");

-- CreateIndex
CREATE INDEX "submission_attempts_ipHash_createdAt_idx" ON "submission_attempts"("ipHash", "createdAt");
