-- AlterTable
ALTER TABLE "PaymentOrder" ALTER COLUMN "shipmentId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "GastoGeneral" (
    "id" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GastoGeneral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GastoGeneral_paymentOrderId_idx" ON "GastoGeneral"("paymentOrderId");

-- AddForeignKey
ALTER TABLE "GastoGeneral" ADD CONSTRAINT "GastoGeneral_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "PaymentOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
