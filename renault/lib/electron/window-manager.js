const { BrowserWindow, Notification } = require("electron")
const path = require("path")
const fs = require("fs")
const { getAppIconPath } = require("./utils")

let mainWindow = null
let isQuitting = false

function appendDesktopLog(message) {
  const logFile = process.env.ELECTRON_LOG_FILE
  if (!logFile) return
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`)
  } catch {
    console.warn("[window-manager] logDesktop failed")
  }
}

function createWindow(appPort) {
  if (mainWindow) {
    if (!mainWindow.isVisible()) mainWindow.show()
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    return mainWindow
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "..", "..", "preload.js"),
    },
    icon: getAppIconPath() || undefined,
    title: "Renault ERP",
  })

  const targetUrl = `http://localhost:${appPort}/login?desktop=1&ts=${Date.now()}`
  appendDesktopLog(`[window] loadURL ${targetUrl}`)
  mainWindow.webContents.session.clearCache().catch(() => {})
  mainWindow.webContents.session
    .clearStorageData({
      storages: ["serviceworkers", "cachestorage"],
    })
    .catch(() => {})
  mainWindow.loadURL(targetUrl)

  mainWindow.webContents.on("did-fail-load", (_event, code, desc, url) => {
    appendDesktopLog(`[window] did-fail-load code=${code} desc=${desc} url=${url}`)
  })

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    appendDesktopLog(
      `[window] render-process-gone reason=${details.reason} exitCode=${details.exitCode}`,
    )
  })

  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow.hide()
      showNotification("Renault ERP", "El sistema sigue ejecutándose en segundo plano.")
    }
  })

  return mainWindow
}

function showNotification(title, body) {
  if (Notification.isSupported()) {
    new Notification({ title, body, icon: getAppIconPath() || undefined }).show()
    return true
  }
  return false
}

function setQuitting(val) {
  isQuitting = val
}
function getMainWindow() {
  return mainWindow
}

module.exports = { createWindow, showNotification, setQuitting, getMainWindow }
