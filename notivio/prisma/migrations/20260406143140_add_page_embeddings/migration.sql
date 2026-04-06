-- AlterTable
ALTER TABLE "TutorEventLog" ALTER COLUMN "suggestedNextSteps" DROP DEFAULT;

-- CreateTable
CREATE TABLE "PageEmbedding" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "chunkText" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageEmbedding_userId_idx" ON "PageEmbedding"("userId");

-- CreateIndex
CREATE INDEX "PageEmbedding_pageId_idx" ON "PageEmbedding"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "PageEmbedding_pageId_chunkIndex_key" ON "PageEmbedding"("pageId", "chunkIndex");

-- AddForeignKey
ALTER TABLE "PageEmbedding" ADD CONSTRAINT "PageEmbedding_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageEmbedding" ADD CONSTRAINT "PageEmbedding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
