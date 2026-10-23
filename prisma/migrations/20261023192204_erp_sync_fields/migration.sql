-- AlterTable
ALTER TABLE "PaymentOrder" ADD COLUMN     "erpEnviado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "erpEnviadoAt" TIMESTAMP(3),
ADD COLUMN     "erpError" TEXT;
