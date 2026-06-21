-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN "employerCostRateSnapshot" INTEGER;
ALTER TABLE "TimeEntry" ADD COLUMN "taxRateSnapshot" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'FREELANCER',
    "status" TEXT NOT NULL DEFAULT 'INVITED',
    "defaultCostRate" INTEGER NOT NULL DEFAULT 0,
    "defaultBillableRate" INTEGER NOT NULL DEFAULT 0,
    "taxWithholdingRateBps" INTEGER NOT NULL DEFAULT 0,
    "employerCostRateBps" INTEGER NOT NULL DEFAULT 0,
    "redmineApiKeyEnc" TEXT,
    "redmineUserId" INTEGER,
    "redmineConnectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "defaultBillableRate", "defaultCostRate", "email", "id", "name", "passwordHash", "redmineApiKeyEnc", "redmineConnectedAt", "redmineUserId", "role", "status") SELECT "createdAt", "defaultBillableRate", "defaultCostRate", "email", "id", "name", "passwordHash", "redmineApiKeyEnc", "redmineConnectedAt", "redmineUserId", "role", "status" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
