-- AlterTable
ALTER TABLE "PaymentOrder" ADD COLUMN     "costoRepuveTitulo" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "costoRepuveTitulo" DOUBLE PRECISION NOT NULL DEFAULT 0;
