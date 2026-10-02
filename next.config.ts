import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // las fotos de equipo van como texto base64 dentro de la acción del servidor
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
