-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folio" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cliente" TEXT NOT NULL,
    "tipoMaquina" TEXT NOT NULL,
    "anio" TEXT,
    "origenCiudad" TEXT,
    "destinoCiudad" TEXT,
    "fotoUrl" TEXT,
    "vendedor" TEXT,
    "costoFleteUSA" REAL NOT NULL DEFAULT 0,
    "costoImportacion" REAL NOT NULL DEFAULT 0,
    "costoManiobras" REAL NOT NULL DEFAULT 0,
    "costoFleteMx" REAL NOT NULL DEFAULT 0,
    "costoPermiso" REAL NOT NULL DEFAULT 0,
    "ivaPorcentaje" REAL NOT NULL DEFAULT 0,
    "estatus" TEXT NOT NULL DEFAULT 'Pendiente',
    "shipmentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cotizacion_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_folio_key" ON "Cotizacion"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_shipmentId_key" ON "Cotizacion"("shipmentId");

-- CreateIndex
CREATE INDEX "Cotizacion_estatus_idx" ON "Cotizacion"("estatus");
