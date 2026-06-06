-- CreateTable
CREATE TABLE "TutorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredTone" TEXT NOT NULL DEFAULT 'encouraging',
    "preferredPersona" TEXT NOT NULL DEFAULT 'patient',
    "memoryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "studyPatterns" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptMetric" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "confusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastAttempt" TIMESTAMP(3),
    "lastWrongExamples" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConceptMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorEventLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "reasoningSummary" TEXT,
    "confidence" DOUBLE PRECISION,
    "suggestedNextSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "snapshotPointer" TEXT,
    "redacted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TutorProfile_userId_key" ON "TutorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptMetric_userId_conceptId_key" ON "ConceptMetric"("userId", "conceptId");

-- CreateIndex
CREATE INDEX "ConceptMetric_userId_updatedAt_idx" ON "ConceptMetric"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "TutorEventLog_userId_createdAt_idx" ON "TutorEventLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "TutorProfile" ADD CONSTRAINT "TutorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptMetric" ADD CONSTRAINT "ConceptMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorEventLog" ADD CONSTRAINT "TutorEventLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
