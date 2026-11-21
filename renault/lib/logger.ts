type LogLevel = "info" | "warn" | "error" | "debug"

const isDev = process.env.NODE_ENV === "development"

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context && { context }),
  }
  if (level === "error") {
    console.error(JSON.stringify(entry))
  } else if (isDev) {
    console[level](JSON.stringify(entry))
  }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => log("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => log("error", message, context),
  debug: (message: string, context?: Record<string, unknown>) => log("debug", message, context),
}
