export type AppRuntime = "web" | "electron"

export function getAppRuntime(): AppRuntime {
  if (typeof process === "undefined") return "web"
  return process.env?.APP_RUNTIME === "electron" ? "electron" : "web"
}

export function isElectronRuntime(): boolean {
  return getAppRuntime() === "electron"
}
