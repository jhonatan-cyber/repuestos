/**
 * WebSocket Server for instant device blocking.
 *
 * Runs alongside the web server (port 5001 by default).
 * Desktop apps connect via WebSocket and register their deviceId.
 * When admin blocks/unblocks a device, sends instant notification.
 *
 * Usage:
 *   node lib/ws-server.js
 *
 * In dev, run alongside `bun run dev`:
 *   start /B node lib\ws-server.js
 *   bun run dev
 */

const http = require("http")
const { WebSocketServer } = require("ws")

const WS_PORT = parseInt(process.env.WS_PORT || "5001", 10)

// Map of connected devices: deviceId -> Set<WebSocket>
const clients = new Map()

function registerClient(ws, deviceId) {
  if (!deviceId) return

  if (!clients.has(deviceId)) {
    clients.set(deviceId, new Set())
  }
  clients.get(deviceId).add(ws)

  console.log(`[ws] Device connected: ${deviceId} (${clients.size} devices)`)

  ws.on("close", () => {
    const set = clients.get(deviceId)
    if (set) {
      set.delete(ws)
      if (set.size === 0) clients.delete(deviceId)
    }
    console.log(`[ws] Device disconnected: ${deviceId}`)
  })
}

function notifyDevice(deviceId, message) {
  const set = clients.get(deviceId)
  if (!set || set.size === 0) return false

  const data = JSON.stringify(message)
  for (const ws of set) {
    if (ws.readyState === 1) {
      ws.send(data)
    }
  }
  return true
}

// --- HTTP server (for admin API to send notifications) ---
const server = http.createServer((req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === "POST" && req.url === "/notify") {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", () => {
      try {
        const { deviceId, action, reason } = JSON.parse(body)
        if (!deviceId || !action) {
          res.writeHead(400, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: "deviceId y action requeridos" }))
          return
        }

        const delivered = notifyDevice(deviceId, {
          action,
          reason,
          timestamp: new Date().toISOString(),
        })

        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ delivered, connected: clients.has(deviceId) }))
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "JSON inválido" }))
      }
    })
    return
  }

  // Health check
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ ok: true, connectedDevices: clients.size }))
    return
  }

  res.writeHead(404)
  res.end()
})

// --- WebSocket server ---
const wss = new WebSocketServer({ server })

wss.on("connection", (ws) => {
  let registered = false

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString())

      if (msg.type === "register" && msg.deviceId) {
        registerClient(ws, msg.deviceId)
        registered = true
        ws.send(JSON.stringify({ type: "registered", deviceId: msg.deviceId }))
      }
    } catch {
      // ignore invalid messages
    }
  })

  // Auto-close if not registered within 10s
  const timeout = setTimeout(() => {
    if (!registered) {
      ws.close()
    }
  }, 10_000)

  ws.on("close", () => clearTimeout(timeout))
})

// Registrar error handler ANTES de listen para atrapar EADDRINUSE
// La lib ws re-emite errores del http.Server en WebSocketServer internamente
wss.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`[ws] Port ${WS_PORT} already in use — skipping (another instance is running)`)
    process.exit(0)
  }
  console.error(`[ws] Failed to start: ${err.message}`)
  process.exit(1)
})

server.listen(WS_PORT, () => {
  console.log(`[ws] WebSocket server listening on port ${WS_PORT}`)
  console.log(`[ws] HTTP notify endpoint: http://localhost:${WS_PORT}/notify`)
})
