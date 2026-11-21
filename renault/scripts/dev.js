/**
 * dev.js — Lanza Next.js dev server.
 */

const { spawn } = require("child_process")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")

const next = spawn("bunx next dev -p 5000", {
  cwd: ROOT,
  stdio: ["inherit", "inherit", "inherit"],
  shell: true,
})

next.on("error", (err) => console.error("[next]", err.message))
next.on("exit", (code) => process.exit(code || 0))

process.on("SIGINT", () => {
  next.kill()
  process.exit(0)
})
process.on("SIGTERM", () => {
  next.kill()
  process.exit(0)
})
