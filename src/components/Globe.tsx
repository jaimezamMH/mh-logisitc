// Planeta Tierra (océano + continentes) girando, estilo globo terráqueo —
// dibujado a mano en SVG (sin imágenes externas): dos copias del mismo
// "mapa" una al lado de la otra, y la tira se desliza con CSS en bucle
// infinito para que se vea como si el planeta estuviera girando.
function Continentes({ x = 0 }: { x?: number }) {
  return (
    <g transform={`translate(${x},0)`} fill="#4ade80">
      {/* América */}
      <ellipse cx="30" cy="55" rx="16" ry="26" />
      <ellipse cx="42" cy="95" rx="10" ry="20" />
      <ellipse cx="38" cy="130" rx="7" ry="16" />
      {/* África + Europa */}
      <ellipse cx="135" cy="45" rx="18" ry="14" />
      <ellipse cx="148" cy="85" rx="15" ry="26" />
      <ellipse cx="130" cy="130" rx="9" ry="13" />
      {/* Asia + Oceanía */}
      <ellipse cx="205" cy="40" rx="24" ry="16" />
      <ellipse cx="235" cy="75" rx="28" ry="20" />
      <ellipse cx="190" cy="80" rx="12" ry="10" />
      <ellipse cx="268" cy="135" rx="13" ry="9" />
    </g>
  );
}

export default function Globe({ size = 144, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size, background: "radial-gradient(circle at 50% 45%, #5fa8ff 0%, #1d4ed8 55%, #0f2440 100%)" }}
    >
      <div className="absolute inset-0 mh-earth-spin" style={{ width: "200%", height: "100%" }}>
        <svg viewBox="0 0 280 160" width="100%" height="100%" preserveAspectRatio="none">
          <Continentes x={0} />
          <Continentes x={280} />
        </svg>
      </div>
      {/* sombreado para que se vea esférico, no plano */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 26%, rgba(255,255,255,0.45), transparent 42%), radial-gradient(circle at 72% 78%, rgba(0,0,0,0.4), transparent 60%)",
        }}
      />
    </div>
  );
}
