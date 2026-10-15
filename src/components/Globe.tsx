// Planeta Tierra (océano + continentes) girando, estilo globo terráqueo —
// dibujado a mano en SVG (sin imágenes externas): dos copias del mismo
// "mapa" una al lado de la otra, y la tira se desliza con CSS en bucle
// infinito para que se vea como si el planeta estuviera girando.
function Continentes({ x = 0 }: { x?: number }) {
  return (
    <g transform={`translate(${x},0)`} fill="#f6b73c" stroke="#c9881f" strokeWidth="1.2" strokeLinejoin="round">
      {/* Norteamérica (EUA, México, Canadá) — silueta reconocible, no un óvalo
          genérico: Canadá ancho arriba, Florida como puntita a la derecha,
          México angostándose hasta Centroamérica abajo */}
      <path d="M10,16 L26,8 L42,12 L50,24 L44,36 L54,44 L60,58 L54,68 L46,62 L42,74 L46,84 L36,94 L30,106 L20,92 L14,74 L8,56 L4,36 L6,20 Z" />
      <ellipse cx="33" cy="128" rx="7" ry="16" />
      {/* África + Europa */}
      <ellipse cx="135" cy="43" rx="21" ry="16" />
      <ellipse cx="149" cy="86" rx="17" ry="29" />
      <ellipse cx="130" cy="132" rx="10" ry="14" />
      {/* Asia + Oceanía */}
      <ellipse cx="205" cy="38" rx="27" ry="18" />
      <ellipse cx="236" cy="76" rx="31" ry="22" />
      <ellipse cx="190" cy="80" rx="14" ry="11" />
      <ellipse cx="268" cy="136" rx="15" ry="10" />
    </g>
  );
}

export default function Globe({ size = 144, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 32% 28%, #7dd3fc 0%, #38bdf8 32%, #0ea5e9 58%, #0369a1 85%, #075985 100%)",
      }}
    >
      <div className="absolute inset-0 mh-earth-spin" style={{ width: "200%", height: "100%" }}>
        <svg viewBox="0 0 280 160" width="100%" height="100%" preserveAspectRatio="none">
          <Continentes x={0} />
          <Continentes x={280} />
        </svg>
      </div>
      {/* brillo grande tipo plástico/juguete + sombra del lado contrario, para que se vea esférico y brilloso */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 27% 23%, rgba(255,255,255,0.85), transparent 34%), radial-gradient(circle at 40% 30%, rgba(255,255,255,0.35), transparent 55%), radial-gradient(circle at 74% 80%, rgba(0,0,0,0.42), transparent 62%)",
        }}
      />
    </div>
  );
}
