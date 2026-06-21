-- CreateTable
CREATE TABLE "Disbursement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "note" TEXT,
    "loggedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Disbursement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Disbursement_periodLabel_idx" ON "Disbursement"("periodLabel");
