-- CreateTable
CREATE TABLE "knowledge_sections" (
    "key" VARCHAR(40) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "page" VARCHAR(80) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" VARCHAR(254),

    CONSTRAINT "knowledge_sections_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "knowledge_revisions" (
    "id" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorEmail" VARCHAR(254) NOT NULL,
    "note" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_revisions_sectionKey_createdAt_idx" ON "knowledge_revisions"("sectionKey", "createdAt");

-- AddForeignKey
ALTER TABLE "knowledge_revisions" ADD CONSTRAINT "knowledge_revisions_sectionKey_fkey" FOREIGN KEY ("sectionKey") REFERENCES "knowledge_sections"("key") ON DELETE CASCADE ON UPDATE CASCADE;
