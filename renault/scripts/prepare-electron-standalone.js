const fs = require("fs")
const path = require("path")

const rootDir = process.cwd()
const sourceDir = path.join(rootDir, ".next", "standalone")
const targetDir = path.join(rootDir, ".next", "standalone-electron")
const staticSourceDir = path.join(rootDir, ".next", "static")
const staticTargetDir = path.join(targetDir, ".next", "static")
const publicSourceDir = path.join(rootDir, "public")
const publicTargetDir = path.join(targetDir, "public")
const prismaClientSourceDir = path.join(rootDir, "node_modules", ".prisma", "client")
const prismaClientGeneratedDir = path.join(rootDir, "lib", "generated", "prisma-client")
const runtimeDependencyOverrides = [
  "@libsql/client",
  "@libsql/core",
  "@libsql/hrana-client",
  "@libsql/isomorphic-ws",
  "pg",
  "pg-cloudflare",
  "pg-connection-string",
  "pg-int8",
  "pg-pool",
  "pg-protocol",
  "pg-types",
  "pgpass",
  "postgres-array",
  "postgres-bytea",
  "postgres-date",
  "postgres-interval",
  "split2",
  "xtend",
  "cross-fetch",
  "node-fetch",
  "whatwg-url",
  "tr46",
  "webidl-conversions",
  "js-base64",
  "libsql",
  "promise-limit",
  "ws",
]
const removablePaths = [
  "dist",
  "playwright-report",
  "test-results",
  "tests",
  "build",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "playwright.config.ts",
  "vitest.config.ts",
  "tsconfig.tsbuildinfo",
  "verify-db.ts",
  "skills-lock.json",
]

if (!fs.existsSync(sourceDir)) {
  console.error("")
  console.error("╔══════════════════════════════════════════════════════════╗")
  console.error("║  ERROR: No se encontró .next/standalone                  ║")
  console.error("╚══════════════════════════════════════════════════════════╝")
  console.error("")
  console.error("Esto significa que el build de Next.js no se ejecutó o falló.")
  console.error("")
  console.error("Pasos para solucionar:")
  console.error("  1. Instalar dependencias:  bun install")
  console.error("  2. Verificar que existe:   .env con DATABASE_URL")
  console.error("  3. Ejecutar build:         bun run build")
  console.error("  4. Reintentar:             bun run electron:build")
  console.error("")
  console.error("O simplemente: bun run electron:build (hace todo automáticamente)")
  console.error("")
  process.exit(1)
}

fs.rmSync(targetDir, { recursive: true, force: true })
fs.cpSync(sourceDir, targetDir, {
  recursive: true,
  dereference: true,
})

if (fs.existsSync(staticSourceDir)) {
  fs.mkdirSync(path.dirname(staticTargetDir), { recursive: true })
  fs.cpSync(staticSourceDir, staticTargetDir, {
    recursive: true,
    dereference: true,
  })
}

// Copiar carpeta public/ para que Next.js standalone sirva imágenes y assets estáticos
if (fs.existsSync(publicSourceDir)) {
  fs.cpSync(publicSourceDir, publicTargetDir, {
    recursive: true,
    dereference: true,
  })
  console.log(`Public assets copiados a ${publicTargetDir}`)
}

function syncGeneratedPrismaClient() {
  if (!fs.existsSync(prismaClientSourceDir)) {
    throw new Error(
      `No se encontro el cliente Prisma generado en ${prismaClientSourceDir}. Ejecuta "bun run db:generate".`,
    )
  }

  fs.rmSync(prismaClientGeneratedDir, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(prismaClientGeneratedDir), { recursive: true })
  fs.cpSync(prismaClientSourceDir, prismaClientGeneratedDir, {
    recursive: true,
    dereference: true,
  })
}

function materializeLink(entryPath) {
  const stat = fs.lstatSync(entryPath)
  if (!stat.isSymbolicLink()) {
    return
  }

  const realPath = fs.realpathSync(entryPath)
  fs.rmSync(entryPath, { recursive: true, force: true })

  const realStat = fs.statSync(realPath)
  if (realStat.isDirectory()) {
    fs.mkdirSync(entryPath, { recursive: true })
    for (const child of fs.readdirSync(realPath)) {
      fs.cpSync(path.join(realPath, child), path.join(entryPath, child), {
        recursive: true,
        dereference: true,
      })
    }
    return
  }

  fs.cpSync(realPath, entryPath, {
    recursive: true,
    dereference: true,
  })
}

function copyPackageIfMissing(sourcePackageDir, packageName, nodeModulesDir) {
  const destination = path.join(nodeModulesDir, packageName)

  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.cpSync(sourcePackageDir, destination, {
    recursive: true,
    dereference: true,
    force: true,
  })
}

function syncRuntimeDependency(packageName, nodeModulesDir) {
  const segments = packageName.split("/")
  const sourcePath = path.join(rootDir, "node_modules", ...segments)
  const destinationPath = path.join(nodeModulesDir, ...segments)

  if (!fs.existsSync(sourcePath)) {
    return
  }

  fs.rmSync(destinationPath, {
    recursive: true,
    force: true,
  })
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true })
  fs.cpSync(sourcePath, destinationPath, {
    recursive: true,
    dereference: true,
    force: true,
  })
}

function exposePnpmPackages(nodeModulesDir) {
  const pnpmDir = path.join(nodeModulesDir, ".pnpm")

  if (!fs.existsSync(pnpmDir)) {
    return
  }

  for (const storeEntry of fs.readdirSync(pnpmDir)) {
    const storeNodeModulesDir = path.join(pnpmDir, storeEntry, "node_modules")

    if (!fs.existsSync(storeNodeModulesDir)) {
      continue
    }

    for (const entry of fs.readdirSync(storeNodeModulesDir)) {
      const entryPath = path.join(storeNodeModulesDir, entry)
      const stat = fs.lstatSync(entryPath)

      if (stat.isSymbolicLink()) {
        continue
      }

      if (entry.startsWith("@") && stat.isDirectory()) {
        for (const scopedEntry of fs.readdirSync(entryPath)) {
          copyPackageIfMissing(
            path.join(entryPath, scopedEntry),
            path.join(entry, scopedEntry),
            nodeModulesDir,
          )
        }
        continue
      }

      copyPackageIfMissing(entryPath, entry, nodeModulesDir)
    }
  }
}

function materializeNodeModulesLinks(nodeModulesDir) {
  if (!fs.existsSync(nodeModulesDir)) {
    return
  }

  for (const entry of fs.readdirSync(nodeModulesDir)) {
    const entryPath = path.join(nodeModulesDir, entry)
    const stat = fs.lstatSync(entryPath)

    if (stat.isSymbolicLink()) {
      materializeLink(entryPath)
      continue
    }

    if (stat.isDirectory() && entry.startsWith("@")) {
      for (const scopedEntry of fs.readdirSync(entryPath)) {
        materializeLink(path.join(entryPath, scopedEntry))
      }
    }
  }
}

function removeUnneededArtifacts(baseDir) {
  for (const relativePath of removablePaths) {
    fs.rmSync(path.join(baseDir, relativePath), {
      recursive: true,
      force: true,
    })
  }
}

const targetNodeModulesDir = path.join(targetDir, "node_modules")
const targetNextNodeModulesDir = path.join(targetDir, ".next", "node_modules")
const targetNextServerNodeModulesDir = path.join(targetDir, ".next", "server", "node_modules")

removeUnneededArtifacts(targetDir)
materializeNodeModulesLinks(targetNodeModulesDir)
materializeNodeModulesLinks(targetNextNodeModulesDir)
exposePnpmPackages(targetNodeModulesDir)
for (const packageName of runtimeDependencyOverrides) {
  syncRuntimeDependency(packageName, targetNodeModulesDir)
  syncRuntimeDependency(packageName, targetNextServerNodeModulesDir)
}
fs.rmSync(path.join(targetNodeModulesDir, ".pnpm"), {
  recursive: true,
  force: true,
})
syncGeneratedPrismaClient()

// Copiar .env al directorio standalone para que Electron lo cargue en producción
const envSourcePath = path.join(rootDir, ".env")
const envTargetPath = path.join(targetDir, ".env")
if (fs.existsSync(envSourcePath)) {
  fs.copyFileSync(envSourcePath, envTargetPath)
  console.log(".env copiado al standalone")
} else {
  console.warn("Advertencia: no se encontró .env en la raíz del proyecto")
}

console.log(`Standalone de Electron preparado en ${targetDir}`)
