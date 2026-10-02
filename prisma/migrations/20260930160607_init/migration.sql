-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folio" TEXT NOT NULL,
    "semana" INTEGER,
    "equipoDescripcion" TEXT NOT NULL,
    "categoria" TEXT,
    "tipoUnidad" TEXT,
    "serie" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "vendedor" TEXT,
    "estatus" TEXT NOT NULL DEFAULT 'Pendiente',
    "origenCiudad" TEXT,
    "aduana" TEXT,
    "destinoCiudad" TEXT,
    "proveedorCompra" TEXT,
    "provFleteUSA" TEXT,
    "provAgenteAduanal" TEXT,
    "costoFleteUSA" REAL NOT NULL DEFAULT 0,
    "costoImportacion" REAL NOT NULL DEFAULT 0,
    "costoManiobras" REAL NOT NULL DEFAULT 0,
    "costoFleteMx" REAL NOT NULL DEFAULT 0,
    "costoPermiso" REAL NOT NULL DEFAULT 0,
    "fleteMexAplica" BOOLEAN NOT NULL DEFAULT true,
    "fechaCompra" DATETIME,
    "fechaSalidaUSA" DATETIME,
    "fechaCruce" DATETIME,
    "fechaSalidaProgramada" DATETIME,
    "fechaEntrega" DATETIME,
    "tiempoCicloDias" INTEGER,
    "mesVenta" TEXT,
    "documentos" TEXT,
    "incidencias" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StatusEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipmentId" TEXT NOT NULL,
    "estatusAnterior" TEXT,
    "estatusNuevo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" TEXT,
    "comentario" TEXT,
    CONSTRAINT "StatusEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folio" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "fechaGenerada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generadaPor" TEXT,
    "costoFleteUSA" REAL NOT NULL,
    "costoImportacion" REAL NOT NULL,
    "costoManiobras" REAL NOT NULL,
    "costoFleteMx" REAL NOT NULL,
    "costoPermiso" REAL NOT NULL,
    "total" REAL NOT NULL,
    "estatusPago" TEXT NOT NULL DEFAULT 'Pendiente',
    "notas" TEXT,
    CONSTRAINT "PaymentOrder_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipmentId" TEXT,
    "vendedor" TEXT NOT NULL,
    "comprador" TEXT,
    "tipoUnidad" TEXT,
    "tiempoCicloDias" INTEGER,
    "fecha" DATETIME,
    "mes" TEXT,
    "anio" INTEGER,
    "fleteMex" BOOLEAN NOT NULL DEFAULT true,
    "origenDato" TEXT NOT NULL DEFAULT 'app',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostoHistorico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proveedorCompra" TEXT,
    "provFleteUSA" TEXT,
    "provAgenteAduanal" TEXT,
    "costoFleteUSA" REAL NOT NULL DEFAULT 0,
    "costoImportacion" REAL NOT NULL DEFAULT 0,
    "costoFleteMx" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipmentId" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRecordatorio" DATETIME,
    "texto" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'comentario',
    "autor" TEXT,
    "resuelto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_folio_key" ON "Shipment"("folio");

-- CreateIndex
CREATE INDEX "Shipment_estatus_idx" ON "Shipment"("estatus");

-- CreateIndex
CREATE INDEX "Shipment_fechaSalidaProgramada_idx" ON "Shipment"("fechaSalidaProgramada");

-- CreateIndex
CREATE INDEX "StatusEvent_shipmentId_idx" ON "StatusEvent"("shipmentId");

-- CreateIndex
CREATE INDEX "StatusEvent_fecha_idx" ON "StatusEvent"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_folio_key" ON "PaymentOrder"("folio");

-- CreateIndex
CREATE INDEX "PaymentOrder_shipmentId_idx" ON "PaymentOrder"("shipmentId");

-- CreateIndex
CREATE INDEX "Sale_mes_idx" ON "Sale"("mes");

-- CreateIndex
CREATE INDEX "Sale_vendedor_idx" ON "Sale"("vendedor");

-- CreateIndex
CREATE INDEX "Comment_shipmentId_idx" ON "Comment"("shipmentId");

-- CreateIndex
CREATE INDEX "Comment_fechaRecordatorio_idx" ON "Comment"("fechaRecordatorio");
