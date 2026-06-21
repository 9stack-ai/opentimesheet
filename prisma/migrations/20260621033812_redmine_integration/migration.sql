-- AlterTable
ALTER TABLE "Project" ADD COLUMN "redmineProjectId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "redmineApiKeyEnc" TEXT;
ALTER TABLE "User" ADD COLUMN "redmineConnectedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "redmineUserId" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "source" TEXT NOT NULL DEFAULT 'LOCAL',
    "redmineIssueId" INTEGER,
    "redmineUpdatedOn" DATETIME,
    "redmineClosed" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("id", "name", "projectId", "status") SELECT "id", "name", "projectId", "status" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE UNIQUE INDEX "Task_projectId_redmineIssueId_key" ON "Task"("projectId", "redmineIssueId");
CREATE TABLE "new_TimeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "hours" REAL NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "costRateSnapshot" INTEGER,
    "billableRateSnapshot" INTEGER,
    "rejectReason" TEXT,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "redmineTimeEntryId" INTEGER,
    "redminePushStatus" TEXT NOT NULL DEFAULT 'pending',
    "redminePushedAt" DATETIME,
    "redminePushError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TimeEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TimeEntry" ("approvedAt", "approvedById", "billableRateSnapshot", "costRateSnapshot", "createdAt", "date", "hours", "id", "note", "rejectReason", "status", "taskId", "userId") SELECT "approvedAt", "approvedById", "billableRateSnapshot", "costRateSnapshot", "createdAt", "date", "hours", "id", "note", "rejectReason", "status", "taskId", "userId" FROM "TimeEntry";
DROP TABLE "TimeEntry";
ALTER TABLE "new_TimeEntry" RENAME TO "TimeEntry";
CREATE INDEX "TimeEntry_userId_date_idx" ON "TimeEntry"("userId", "date");
CREATE INDEX "TimeEntry_status_date_idx" ON "TimeEntry"("status", "date");
CREATE INDEX "TimeEntry_redminePushStatus_idx" ON "TimeEntry"("redminePushStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
