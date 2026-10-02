-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "costoFleteUSA" REAL NOT NULL DEFAULT 0,
    "costoImportacion" REAL NOT NULL DEFAULT 0,
    "costoManiobras" REAL NOT NULL DEFAULT 0,
    "costoFleteMx" REAL NOT NULL DEFAULT 0,
    "costoPermiso" REAL NOT NULL DEFAULT 0,
    "fleteMexAplica" BOOLEAN NOT NULL DEFAULT true,
    "precioFleteUSA" REAL NOT NULL DEFAULT 0,
    "precioImportacion" REAL NOT NULL DEFAULT 0,
    "precioFleteMx" REAL NOT NULL DEFAULT 0,
    "precioPermiso" REAL NOT NULL DEFAULT 0,
    "fechaInicio" DATETIME,
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
INSERT INTO "new_Shipment" ("aduana", "categoria", "cliente", "costoFleteMx", "costoFleteUSA", "costoImportacion", "costoManiobras", "costoPermiso", "createdAt", "destinoCiudad", "documentos", "equipoDescripcion", "estatus", "fechaCompra", "fechaCruce", "fechaEntrega", "fechaInicio", "fechaSalidaProgramada", "fechaSalidaUSA", "fleteMexAplica", "folio", "fotoUrl", "id", "incidencias", "mesVenta", "origenCiudad", "provAgenteAduanal", "provFleteUSA", "proveedorCompra", "semana", "serie", "tiempoCicloDias", "tipoUnidad", "updatedAt", "vendedor") SELECT "aduana", "categoria", "cliente", "costoFleteMx", "costoFleteUSA", "costoImportacion", "costoManiobras", "costoPermiso", "createdAt", "destinoCiudad", "documentos", "equipoDescripcion", "estatus", "fechaCompra", "fechaCruce", "fechaEntrega", "fechaInicio", "fechaSalidaProgramada", "fechaSalidaUSA", "fleteMexAplica", "folio", "fotoUrl", "id", "incidencias", "mesVenta", "origenCiudad", "provAgenteAduanal", "provFleteUSA", "proveedorCompra", "semana", "serie", "tiempoCicloDias", "tipoUnidad", "updatedAt", "vendedor" FROM "Shipment";
DROP TABLE "Shipment";
ALTER TABLE "new_Shipment" RENAME TO "Shipment";
CREATE UNIQUE INDEX "Shipment_folio_key" ON "Shipment"("folio");
CREATE INDEX "Shipment_estatus_idx" ON "Shipment"("estatus");
CREATE INDEX "Shipment_fechaSalidaProgramada_idx" ON "Shipment"("fechaSalidaProgramada");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
