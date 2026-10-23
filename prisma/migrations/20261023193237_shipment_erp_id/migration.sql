-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "erpId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_erpId_key" ON "Shipment"("erpId");
