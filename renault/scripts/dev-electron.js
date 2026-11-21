/**
 * dev-electron.js — Lanza WebSocket server + Electron simultáneamente.
 *
 * Mata ambos procesos al hacer Ctrl+C.
 */

const { spawn } = require("child_process")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
const isFull = process.argv.includes("--full")
const electronArgs = isFull ? "" : "--no-server"

function log(tag, msg) {
  console.log(`[${tag}] ${msg}`)
}

// --- WS Server ---
const ws = spawn("node lib/ws-server.js", {
  cwd: ROOT,
  stdio: ["ignore", "inherit", "inherit"],
  shell: true,
})

ws.on("error", (err) => log("ws", `Error: ${err.message}`))
ws.on("exit", (code) => {
  if (code && code !== 0) log("ws", `Terminado (code: ${code})`)
})

// --- Electron (resolvemos el binary para evitar DEP0190) ---
let electronBin
try {
  electronBin = require("electron")
} catch {
  electronBin = "electron"
}

const electron = spawn(`"${electronBin}" . ${electronArgs}`, {
  cwd: ROOT,
  stdio: ["inherit", "inherit", "inherit"],
  shell: true,
})

electron.on("error", (err) => log("electron", `Error: ${err.message}`))
electron.on("exit", (code) => {
  log("electron", `Terminado (code: ${code})`)
  ws.kill()
  process.exit(code || 0)
})

// --- Cleanup ---
process.on("SIGINT", () => {
  log("dev", "Cerrando...")
  ws.kill()
  electron.kill()
  process.exit(0)
})

process.on("SIGTERM", () => {
  ws.kill()
  electron.kill()
  process.exit(0)
})
