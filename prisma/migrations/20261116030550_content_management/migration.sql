-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "interest_registrations" ADD COLUMN     "programmeId" TEXT;

-- CreateTable
CREATE TABLE "programmes" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "summary" VARCHAR(300),
    "overview" TEXT,
    "audience" TEXT,
    "duration" VARCHAR(200),
    "studyFormat" VARCHAR(200),
    "entryRequirements" TEXT,
    "fees" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programmes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_content" (
    "key" VARCHAR(40) NOT NULL,
    "draft" JSONB NOT NULL,
    "published" JSONB,
    "publishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_content_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "programmes_slug_key" ON "programmes"("slug");

-- CreateIndex
CREATE INDEX "programmes_status_sortOrder_idx" ON "programmes"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "interest_registrations_programmeId_idx" ON "interest_registrations"("programmeId");

-- AddForeignKey
ALTER TABLE "interest_registrations" ADD CONSTRAINT "interest_registrations_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
