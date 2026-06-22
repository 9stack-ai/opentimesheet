-- CreateTable
CREATE TABLE "Compensation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "effectiveFrom" DATETIME NOT NULL,
    "effectiveTo" DATETIME,
    "kind" TEXT NOT NULL DEFAULT 'HOURLY',
    "costRate" INTEGER NOT NULL DEFAULT 0,
    "billableRate" INTEGER NOT NULL DEFAULT 0,
    "fixedMonthlySalary" INTEGER NOT NULL DEFAULT 0,
    "taxWithholdingRateBps" INTEGER NOT NULL DEFAULT 0,
    "employerCostRateBps" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Compensation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Compensation_userId_effectiveFrom_idx" ON "Compensation"("userId", "effectiveFrom");
