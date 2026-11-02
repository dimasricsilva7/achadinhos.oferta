-- CreateTable
CREATE TABLE IF NOT EXISTS "VisitorSession" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "path" TEXT,
    "device" TEXT,
    "referrer" TEXT,
    "pageViews" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VisitorSession_lastSeenAt_idx" ON "VisitorSession"("lastSeenAt");
