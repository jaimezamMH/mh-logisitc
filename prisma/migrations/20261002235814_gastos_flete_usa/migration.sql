-- AlterTable
ALTER TABLE "PaymentOrder" ADD COLUMN "detalleFleteUSA" TEXT;

-- CreateTable
CREATE TABLE "GastoFleteUSA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipmentId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentOrderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GastoFleteUSA_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GastoFleteUSA_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "PaymentOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GastoFleteUSA_shipmentId_idx" ON "GastoFleteUSA"("shipmentId");

-- CreateIndex
CREATE INDEX "GastoFleteUSA_paymentOrderId_idx" ON "GastoFleteUSA"("paymentOrderId");
