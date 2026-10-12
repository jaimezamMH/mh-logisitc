"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { importShipments, type ImportShipmentRow } from "@/lib/actions";
import { useRouter } from "next/navigation";

type CampoDestino = keyof ImportShipmentRow;

const CAMPOS: { key: CampoDestino; label: string; tipo?: "numero" }[] = [
  { key: "semana", label: "Semana", tipo: "numero" },
  { key: "equipoDescripcion", label: "Equipo (descripción)" },
  { key: "categoria", label: "Categoría" },
  { key: "tipoUnidad", label: "Tipo de unidad (CAMION/AMARILLO)" },
  { key: "cliente", label: "Cliente" },
  { key: "serie", label: "Serie" },
  { key: "vendedor", label: "Vendedor" },
  { key: "estatus", label: "Estatus / Etapa" },
  { key: "origenCiudad", label: "Origen" },
  { key: "aduana", label: "Aduana" },
  { key: "destinoCiudad", label: "Destino" },
  { key: "proveedorCompra", label: "Proveedor de compra" },
  { key: "provFleteUSA", label: "Proveedor flete USA" },
  { key: "provAgenteAduanal", label: "Agente aduanal" },
  { key: "costoFleteUSA", label: "Costo flete USA", tipo: "numero" },
  { key: "costoImportacion", label: "Costo importación", tipo: "numero" },
  { key: "costoManiobras", label: "Costo maniobra/reparación", tipo: "numero" },
  { key: "costoFleteMx", label: "Costo flete México", tipo: "numero" },
  { key: "costoPermiso", label: "Costo permiso/seguro", tipo: "numero" },
  { key: "costoRepuveTitulo", label: "Costo repuve/título", tipo: "numero" },
];

const PISTAS: Partial<Record<CampoDestino, string[]>> = {
  semana: ["semana"],
  equipoDescripcion: ["equipo"],
  categoria: ["categoria", "categoría"],
  tipoUnidad: ["tipo"],
  cliente: ["cliente"],
  serie: ["serie"],
  vendedor: ["vendedor"],
  estatus: ["estatus", "etapa"],
  origenCiudad: ["origen"],
  aduana: ["aduana"],
  destinoCiudad: ["destino"],
  proveedorCompra: ["proveedor de compra", "proveedor compra"],
  provFleteUSA: ["prov flete usa", "flete usa"],
  provAgenteAduanal: ["agente aduanal", "agente"],
  costoFleteUSA: ["costo flete usa"],
  costoImportacion: ["costo importacion", "importación"],
  costoManiobras: ["maniobra"],
  costoFleteMx: ["flete mx", "flete mexicano"],
  costoPermiso: ["permiso"],
  costoRepuveTitulo: ["repuve", "titulo", "título"],
};

function guessColumn(headers: string[], campo: CampoDestino): string {
  const pistas = PISTAS[campo] ?? [];
  const lower = headers.map((h) => h.toLowerCase());
  for (const pista of pistas) {
    const idx = lower.findIndex((h) => h.includes(pista));
    if (idx >= 0) return headers[idx];
  }
  return "";
}

export default function ImportadorExcel() {
  const router = useRouter();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapeo, setMapeo] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResultado(null);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    if (json.length === 0) return;
    const hdrs = Object.keys(json[0]);
    setHeaders(hdrs);
    setRows(json);
    const auto: Record<string, string> = {};
    for (const campo of CAMPOS) {
      auto[campo.key] = guessColumn(hdrs, campo.key);
    }
    setMapeo(auto);
  }

  async function confirmarImportacion() {
    setCargando(true);
    setResultado(null);
    try {
      const parsed: ImportShipmentRow[] = rows.map((row) => {
        const get = (campo: CampoDestino) => {
          const col = mapeo[campo];
          if (!col) return undefined;
          const v = row[col];
          return typeof v === "string" ? v.trim() : v;
        };
        const num = (campo: CampoDestino) => {
          const v = get(campo);
          const n = Number(v);
          return Number.isFinite(n) ? n : undefined;
        };
        return {
          semana: num("semana") as number | undefined,
          equipoDescripcion: String(get("equipoDescripcion") ?? ""),
          categoria: get("categoria") as string | undefined,
          tipoUnidad: get("tipoUnidad") as string | undefined,
          cliente: String(get("cliente") ?? ""),
          serie: String(get("serie") ?? ""),
          vendedor: get("vendedor") as string | undefined,
          estatus: get("estatus") as string | undefined,
          origenCiudad: get("origenCiudad") as string | undefined,
          aduana: get("aduana") as string | undefined,
          destinoCiudad: get("destinoCiudad") as string | undefined,
          proveedorCompra: get("proveedorCompra") as string | undefined,
          provFleteUSA: get("provFleteUSA") as string | undefined,
          provAgenteAduanal: get("provAgenteAduanal") as string | undefined,
          costoFleteUSA: num("costoFleteUSA"),
          costoImportacion: num("costoImportacion"),
          costoManiobras: num("costoManiobras"),
          costoFleteMx: num("costoFleteMx"),
          costoPermiso: num("costoPermiso"),
          costoRepuveTitulo: num("costoRepuveTitulo"),
        };
      });

      const creados = await importShipments(parsed);
      setResultado(`Se importaron ${creados} unidades correctamente.`);
      setRows([]);
      setHeaders([]);
      router.refresh();
    } catch (err) {
      setResultado("Ocurrió un error al importar. Revisa el formato del archivo.");
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="space-y-5">
      <label className="flex flex-col gap-2 text-sm">
        <span className="text-ink-secondary">Selecciona tu archivo Excel (.xlsx) o CSV</span>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFile}
          className="rounded-lg border border-border px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-blue-600 file:text-white file:px-3 file:py-1.5 file:text-sm"
        />
      </label>

      {headers.length > 0 && (
        <>
          <div>
            <p className="text-sm font-medium text-ink-primary mb-2">
              Revisa que cada campo esté conectado a la columna correcta ({rows.length} filas detectadas)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CAMPOS.map((campo) => (
                <label key={campo.key} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-ink-secondary w-40 shrink-0">{campo.label}</span>
                  <select
                    value={mapeo[campo.key] ?? ""}
                    onChange={(e) => setMapeo((m) => ({ ...m, [campo.key]: e.target.value }))}
                    className="flex-1 rounded-lg border border-border px-2 py-1.5 text-xs"
                  >
                    <option value="">— No importar —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-muted">
                  {headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-ink-secondary whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    {headers.map((h) => (
                      <td key={h} className="px-3 py-1.5 whitespace-nowrap text-ink-primary">
                        {String(r[h] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={confirmarImportacion}
            disabled={cargando}
            className="rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5"
          >
            {cargando ? "Importando…" : `Importar ${rows.length} filas`}
          </button>
        </>
      )}

      {resultado && <p className="text-sm text-brand-blue-700">{resultado}</p>}
    </div>
  );
}
