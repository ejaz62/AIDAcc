-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('NEW', 'CONTACTED', 'PAYMENT_PENDING', 'CONFIRMED', 'NOT_PROCEEDING');

-- CreateTable
CREATE TABLE "admission_applications" (
    "id" TEXT NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "whatsapp" VARCHAR(30) NOT NULL,
    "email" VARCHAR(254),
    "location" VARCHAR(120) NOT NULL,
    "course" VARCHAR(150) NOT NULL,
    "batch" VARCHAR(10) NOT NULL,
    "computerKnowledge" VARCHAR(10) NOT NULL,
    "aiExperience" VARCHAR(10) NOT NULL,
    "message" VARCHAR(1000),
    "status" "AdmissionStatus" NOT NULL DEFAULT 'NEW',
    "seenAt" TIMESTAMP(3),
    "ipHash" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_notes" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "authorEmail" VARCHAR(254) NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admission_applications_createdAt_idx" ON "admission_applications"("createdAt");

-- CreateIndex
CREATE INDEX "admission_applications_status_createdAt_idx" ON "admission_applications"("status", "createdAt");

-- CreateIndex
CREATE INDEX "admission_notes_applicationId_createdAt_idx" ON "admission_notes"("applicationId", "createdAt");

-- AddForeignKey
ALTER TABLE "admission_notes" ADD CONSTRAINT "admission_notes_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
