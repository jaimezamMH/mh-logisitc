-- Integración MH Logística <-> ERP (documento de Rubén, 29-oct-2026).
-- Todo es aditivo (columnas nuevas con default o NULL y tablas nuevas): no
-- cambia ni borra datos existentes, así que la versión actual de la app
-- sigue funcionando con la base ya migrada.

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "proveedorCompraId" TEXT,
ADD COLUMN     "origenERP" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "erpUnidadSincronizada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "erpUnidadError" TEXT,
ADD COLUMN     "erpUnidadSincronizadaAt" TIMESTAMP(3);

-- Las unidades que ya tienen erpId llegaron del ERP (o se ligaron a mano).
UPDATE "Shipment" SET "origenERP" = true, "erpUnidadSincronizada" = true WHERE "erpId" IS NOT NULL;

-- AlterTable
ALTER TABLE "PaymentOrder" ADD COLUMN     "swift" TEXT,
ADD COLUMN     "routing" TEXT,
ADD COLUMN     "sucursal" TEXT,
ADD COLUMN     "proveedorId" TEXT,
ADD COLUMN     "proveedorNombre" TEXT,
ADD COLUMN     "costoGastoAdicionalFlete" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "erpPaymentEntry" TEXT,
ADD COLUMN     "erpAviso" TEXT,
ADD COLUMN     "erpPago" TEXT,
ADD COLUMN     "fechaPago" TIMESTAMP(3),
ADD COLUMN     "montoPagado" DOUBLE PRECISION,
ADD COLUMN     "monedaPago" TEXT,
ADD COLUMN     "tipoCambioPago" DOUBLE PRECISION,
ADD COLUMN     "referenciaBancaria" TEXT,
ADD COLUMN     "eliminadaAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProveedorERP" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "actualizadoAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProveedorERP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuentaBancariaERP" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "banco" TEXT,
    "nombreCuenta" TEXT,
    "numeroCuenta" TEXT,
    "clabeIban" TEXT,
    "swift" TEXT,
    "routing" TEXT,
    "sucursal" TEXT,
    "moneda" TEXT,
    "predeterminada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CuentaBancariaERP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegracionEstado" (
    "clave" TEXT NOT NULL,
    "ultimaVez" TIMESTAMP(3) NOT NULL,
    "ultimoError" TEXT,

    CONSTRAINT "IntegracionEstado_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT,
    "entidadId" TEXT,
    "httpStatus" INTEGER,
    "detalle" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentOrder_estatusPago_idx" ON "PaymentOrder"("estatusPago");

-- CreateIndex
CREATE INDEX "ProveedorERP_nombre_idx" ON "ProveedorERP"("nombre");

-- CreateIndex
CREATE INDEX "CuentaBancariaERP_proveedorId_idx" ON "CuentaBancariaERP"("proveedorId");

-- CreateIndex
CREATE INDEX "AuditLog_fecha_idx" ON "AuditLog"("fecha");

-- CreateIndex
CREATE INDEX "AuditLog_entidad_entidadId_idx" ON "AuditLog"("entidad", "entidadId");

-- AddForeignKey
ALTER TABLE "CuentaBancariaERP" ADD CONSTRAINT "CuentaBancariaERP_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "ProveedorERP"("id") ON DELETE CASCADE ON UPDATE CASCADE;
