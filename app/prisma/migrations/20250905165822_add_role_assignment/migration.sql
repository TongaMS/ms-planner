/*
  Warnings:

  - You are about to drop the column `skills` on the `Person` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "harvestId" INTEGER,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "isActive" BOOLEAN,
    "weeklyCapacityHours" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Person_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Person" ("createdAt", "email", "firstName", "harvestId", "id", "isActive", "lastName", "tenantId", "updatedAt", "weeklyCapacityHours") SELECT "createdAt", "email", "firstName", "harvestId", "id", "isActive", "lastName", "tenantId", "updatedAt", "weeklyCapacityHours" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");
CREATE TABLE "new_RolePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "allocationPct" INTEGER NOT NULL,
    "billable" BOOLEAN NOT NULL,
    "expectedRateCents" INTEGER,
    "notes" TEXT,
    "assignedPersonId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RolePlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RolePlan_assignedPersonId_fkey" FOREIGN KEY ("assignedPersonId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RolePlan" ("allocationPct", "billable", "createdAt", "endDate", "expectedRateCents", "id", "notes", "projectId", "roleName", "startDate", "updatedAt") SELECT "allocationPct", "billable", "createdAt", "endDate", "expectedRateCents", "id", "notes", "projectId", "roleName", "startDate", "updatedAt" FROM "RolePlan";
DROP TABLE "RolePlan";
ALTER TABLE "new_RolePlan" RENAME TO "RolePlan";
CREATE INDEX "RolePlan_projectId_idx" ON "RolePlan"("projectId");
CREATE INDEX "RolePlan_assignedPersonId_idx" ON "RolePlan"("assignedPersonId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
