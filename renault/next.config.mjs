/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "localhost",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Silenciar el warning de Turbopack
  turbopack: {},

  // `sql.js` carga su `.wasm` en runtime leyendo su propio directorio; el tracer
  // de Next no lo detecta, así que se incluye explícitamente en el standalone.
  outputFileTracingIncludes: {
    "/api/backup/restore": ["./node_modules/sql.js/dist/**/*"],
  },

  // Excluir módulos nativos del bundle de webpack (pg usa C++ addons y Buffer APIs)
  serverExternalPackages: [
    "sql.js",
    "pg",
    "@prisma/adapter-pg",
    "@prisma/client",
    "@prisma/client-runtime-utils",
    "@prisma/config",
  ],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ]
  },
}

export default nextConfig
