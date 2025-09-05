/*
  Warnings:

  - You are about to drop the column `currency` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedCostCents` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `expectedIncomeCents` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Project` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "RolePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "allocationPct" INTEGER NOT NULL DEFAULT 100,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "expectedRateCents" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RolePlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "harvestId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("createdAt", "harvestId", "id", "name", "tenantId", "updatedAt") SELECT "createdAt", "harvestId", "id", "name", "tenantId", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_harvestId_key" ON "Client"("harvestId");
CREATE INDEX "Client_tenantId_idx" ON "Client"("tenantId");
CREATE TABLE "new_Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "harvestId" INTEGER,
    "skills" JSONB,
    "weeklyCapacityHours" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Person_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Person" ("createdAt", "email", "firstName", "harvestId", "id", "isActive", "lastName", "skills", "tenantId", "updatedAt", "weeklyCapacityHours") SELECT "createdAt", "email", "firstName", "harvestId", "id", "isActive", "lastName", "skills", "tenantId", "updatedAt", "weeklyCapacityHours" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");
CREATE INDEX "Person_tenantId_idx" ON "Person"("tenantId");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT,
    "harvestId" INTEGER,
    "harvestName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("clientId", "createdAt", "harvestId", "harvestName", "id", "isActive", "name", "tenantId", "updatedAt") SELECT "clientId", "createdAt", "harvestId", "harvestName", "id", "isActive", "name", "tenantId", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_harvestId_key" ON "Project"("harvestId");
CREATE INDEX "Project_tenantId_idx" ON "Project"("tenantId");
CREATE INDEX "Project_clientId_idx" ON "Project"("clientId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "RolePlan_projectId_idx" ON "RolePlan"("projectId");
