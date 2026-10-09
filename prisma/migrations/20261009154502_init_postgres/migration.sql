-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "semana" INTEGER,
    "equipoDescripcion" TEXT NOT NULL,
    "categoria" TEXT,
    "tipoUnidad" TEXT,
    "serie" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "vendedor" TEXT,
    "fotoUrl" TEXT,
    "tipoVenta" TEXT NOT NULL DEFAULT 'Equipo',
    "estatus" TEXT NOT NULL DEFAULT 'Pendiente',
    "origenCiudad" TEXT,
    "aduana" TEXT,
    "destinoCiudad" TEXT,
    "proveedorCompra" TEXT,
    "provFleteUSA" TEXT,
    "provAgenteAduanal" TEXT,
    "costoFleteUSA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoImportacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoManiobras" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoFleteMx" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoPermiso" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fleteMexAplica" BOOLEAN NOT NULL DEFAULT true,
    "precioFleteUSA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioImportacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioFleteMx" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioPermiso" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaInicio" TIMESTAMP(3),
    "fechaCompra" TIMESTAMP(3),
    "fechaSalidaUSA" TIMESTAMP(3),
    "fechaCruce" TIMESTAMP(3),
    "fechaSalidaProgramada" TIMESTAMP(3),
    "fechaEntrega" TIMESTAMP(3),
    "tiempoCicloDias" INTEGER,
    "mesVenta" TEXT,
    "documentos" TEXT,
    "incidencias" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "archivoUrl" TEXT NOT NULL,
    "tipo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "estatusAnterior" TEXT,
    "estatusNuevo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" TEXT,
    "comentario" TEXT,

    CONSTRAINT "StatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "fechaGenerada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generadaPor" TEXT,
    "costoFleteUSA" DOUBLE PRECISION NOT NULL,
    "costoImportacion" DOUBLE PRECISION NOT NULL,
    "costoManiobras" DOUBLE PRECISION NOT NULL,
    "costoFleteMx" DOUBLE PRECISION NOT NULL,
    "costoPermiso" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "tipoCambio" DOUBLE PRECISION,
    "concepto" TEXT,
    "estatusPago" TEXT NOT NULL DEFAULT 'Pendiente',
    "notas" TEXT,
    "monedaCuenta" TEXT,
    "banco" TEXT,
    "direccionBanco" TEXT,
    "numeroCuenta" TEXT,
    "clabe" TEXT,
    "titular" TEXT,
    "direccionTitular" TEXT,
    "detalleFleteUSA" TEXT,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GastoFleteUSA" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GastoFleteUSA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT,
    "vendedor" TEXT NOT NULL,
    "comprador" TEXT,
    "tipoUnidad" TEXT,
    "tiempoCicloDias" INTEGER,
    "fecha" TIMESTAMP(3),
    "mes" TEXT,
    "anio" INTEGER,
    "fleteMex" BOOLEAN NOT NULL DEFAULT true,
    "origenDato" TEXT NOT NULL DEFAULT 'app',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cliente" TEXT NOT NULL,
    "tipoMaquina" TEXT NOT NULL,
    "anio" TEXT,
    "origenCiudad" TEXT,
    "destinoCiudad" TEXT,
    "fotoUrl" TEXT,
    "vendedor" TEXT,
    "costoFleteUSA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoImportacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoManiobras" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoFleteMx" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoPermiso" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ivaPorcentaje" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estatus" TEXT NOT NULL DEFAULT 'Pendiente',
    "shipmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostoHistorico" (
    "id" TEXT NOT NULL,
    "proveedorCompra" TEXT,
    "provFleteUSA" TEXT,
    "provAgenteAduanal" TEXT,
    "costoFleteUSA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoImportacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoFleteMx" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostoHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRecordatorio" TIMESTAMP(3),
    "texto" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'comentario',
    "autor" TEXT,
    "resuelto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_folio_key" ON "Shipment"("folio");

-- CreateIndex
CREATE INDEX "Shipment_estatus_idx" ON "Shipment"("estatus");

-- CreateIndex
CREATE INDEX "Shipment_fechaSalidaProgramada_idx" ON "Shipment"("fechaSalidaProgramada");

-- CreateIndex
CREATE INDEX "Documento_shipmentId_idx" ON "Documento"("shipmentId");

-- CreateIndex
CREATE INDEX "StatusEvent_shipmentId_idx" ON "StatusEvent"("shipmentId");

-- CreateIndex
CREATE INDEX "StatusEvent_fecha_idx" ON "StatusEvent"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_folio_key" ON "PaymentOrder"("folio");

-- CreateIndex
CREATE INDEX "PaymentOrder_shipmentId_idx" ON "PaymentOrder"("shipmentId");

-- CreateIndex
CREATE INDEX "GastoFleteUSA_shipmentId_idx" ON "GastoFleteUSA"("shipmentId");

-- CreateIndex
CREATE INDEX "GastoFleteUSA_paymentOrderId_idx" ON "GastoFleteUSA"("paymentOrderId");

-- CreateIndex
CREATE INDEX "Sale_mes_idx" ON "Sale"("mes");

-- CreateIndex
CREATE INDEX "Sale_vendedor_idx" ON "Sale"("vendedor");

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_folio_key" ON "Cotizacion"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_shipmentId_key" ON "Cotizacion"("shipmentId");

-- CreateIndex
CREATE INDEX "Cotizacion_estatus_idx" ON "Cotizacion"("estatus");

-- CreateIndex
CREATE INDEX "Comment_shipmentId_idx" ON "Comment"("shipmentId");

-- CreateIndex
CREATE INDEX "Comment_fechaRecordatorio_idx" ON "Comment"("fechaRecordatorio");

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusEvent" ADD CONSTRAINT "StatusEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoFleteUSA" ADD CONSTRAINT "GastoFleteUSA_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoFleteUSA" ADD CONSTRAINT "GastoFleteUSA_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "PaymentOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
