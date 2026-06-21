-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Income" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "projectId" TEXT,
    "amount" INTEGER NOT NULL,
    "date" DATETIME,
    "note" TEXT,
    "loggedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Income_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Income" ("amount", "createdAt", "date", "id", "loggedById", "note", "source") SELECT "amount", "createdAt", "date", "id", "loggedById", "note", "source" FROM "Income";
DROP TABLE "Income";
ALTER TABLE "new_Income" RENAME TO "Income";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
