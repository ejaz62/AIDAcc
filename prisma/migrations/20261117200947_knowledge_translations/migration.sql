-- AlterTable
ALTER TABLE "knowledge_revisions" ADD COLUMN     "summaryRoman" TEXT,
ADD COLUMN     "summaryUrdu" TEXT;

-- AlterTable
ALTER TABLE "knowledge_sections" ADD COLUMN     "summaryRoman" TEXT,
ADD COLUMN     "summaryUrdu" TEXT;
