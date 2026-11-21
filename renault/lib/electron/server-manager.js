const { spawn } = require("child_process")
const path = require("path")
const fs = require("fs")
const { isDev } = require("./utils")

let nextProcess = null

function appendDesktopLog(message) {
  const logFile = process.env.ELECTRON_LOG_FILE
  if (!logFile) return
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`)
  } catch {
    console.warn("[server-manager] logServer failed")
  }
}

function getServerScriptPath() {
  if (isDev) return path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next")

  const unpacked = path.join(process.resourcesPath, "app.asar.unpacked")
  const appPath = process.cwd()

  const candidates = [
    path.join(unpacked, ".next", "standalone-electron", "server.js"),
    path.join(appPath, ".next", "standalone-electron", "server.js"),
    path.join(appPath, ".next", "standalone", "server.js"),
  ]

  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return null
}

/**
 * Directorio base del server Next.
 *
 * En dev es la raíz del repo; en el build empaquetado es la carpeta del
 * server standalone. El server corre con `cwd: getServerDir()`, así que los
 * datos que escribe (data/custom-permissions.json) quedan en
 * `<serverDir>/data`. El proceso main tiene que usar el mismo path para no
 * divergir del backend web.
 */
function getServerDir() {
  if (isDev) return process.cwd()
  const script = getServerScriptPath()
  return script ? path.dirname(script) : process.cwd()
}

async function startServer(appPort, dbPath, onReady) {
  const script = getServerScriptPath()
  if (!script) throw new Error("No se encontró el servidor de Next.")

  const isWindows = process.platform === "win32"
  let command, args, shell

  if (isDev && isWindows) {
    // Single string con shell:true evita DEP0190 y resuelve bunx desde PATH
    command = `bunx next dev -p ${appPort}`
    args = []
    shell = true
  } else if (isDev) {
    command = path.join(process.cwd(), "node_modules", ".bin", "next")
    args = ["dev", "-p", appPort]
    shell = false
  } else {
    command = process.execPath
    args = [script]
    shell = false
  }

  const env = {
    ...process.env,
    APP_RUNTIME: "electron",
    // No URL-encodear espacios: Prisma/libsql resuelven rutas de filesystem,
    // y `%20` puede hacer que SQLite no encuentre el archivo.
    DATABASE_URL_LOCAL: `file:${dbPath.replace(/\\/g, "/")}`,
    PORT: appPort,
    CLOUD_URL: process.env.CLOUD_URL || "",
  }

  if (!isDev) {
    const delimiter = process.platform === "win32" ? ";" : ":"
    const packagedNodeModules = path.join(process.resourcesPath, "app.asar", "node_modules")
    const standaloneNodeModules = path.join(path.dirname(script), "node_modules")
    const existingNodePath = process.env.NODE_PATH || ""
    env.NODE_PATH = [packagedNodeModules, standaloneNodeModules, existingNodePath]
      .filter(Boolean)
      .join(delimiter)
  }

  if (!isDev) env.ELECTRON_RUN_AS_NODE = "1"

  const serverDir = path.dirname(script)

  nextProcess = spawn(command, args, {
    cwd: isDev ? process.cwd() : serverDir,
    shell: shell,
    env,
  })

  nextProcess.stdout.on("data", (data) => {
    const out = data.toString()
    appendDesktopLog(`[next:stdout] ${out.trim()}`)
    if (out.includes("ready") || out.includes("started")) {
      onReady()
    }
  })

  nextProcess.stderr.on("data", (data) => {
    // No tiramos throw aquí porque Next.js manda muchos warnings por stderr
    // que no son errores fatales (ej: Turbopack warnings).
    const err = data.toString()
    appendDesktopLog(`[next:stderr] ${err.trim()}`)
    console.error(`Next.js Stderr: ${err}`)
  })

  nextProcess.on("exit", (code, signal) => {
    appendDesktopLog(`[next:exit] code=${code} signal=${signal}`)
  })
}

function killServer() {
  if (nextProcess) nextProcess.kill()
}

async function waitForServer(port, timeoutMs = 60000) {
  const start = Date.now()
  const url = `http://localhost:${port}/login`
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 404) return true
    } catch (e) {
      console.warn("[server-manager] Health check failed:", e?.message)
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

module.exports = { startServer, killServer, waitForServer, getServerDir }
