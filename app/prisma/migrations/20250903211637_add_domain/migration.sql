-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "harvestId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "harvestId" INTEGER,
    "harvestName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "currency" TEXT,
    "expectedIncomeCents" INTEGER,
    "estimatedCostCents" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "weeklyCapacityHours" INTEGER NOT NULL DEFAULT 40,
    "skills" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "harvestId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_harvestId_key" ON "Client"("harvestId");

-- CreateIndex
CREATE INDEX "Client_tenantId_idx" ON "Client"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_harvestId_key" ON "Project"("harvestId");

-- CreateIndex
CREATE INDEX "Project_tenantId_clientId_idx" ON "Project"("tenantId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");

-- CreateIndex
CREATE INDEX "Person_tenantId_idx" ON "Person"("tenantId");
