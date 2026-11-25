const { app, ipcMain, dialog, BrowserWindow } = require("electron")
const { autoUpdater } = require("electron-updater")
const path = require("path")
const net = require("net")
const fs = require("fs")

if (!app.isPackaged) {
  try {
    require("dotenv").config({ override: true })
  } catch (error) {
    console.warn("[main] No se pudo cargar dotenv en desarrollo:", error?.message || error)
  }
}

const { ensureDesktopDatabase } = require("./lib/electron/db-manager")
const {
  INSTALL_STATE_FILE,
  readInstallerInstallId,
  readInstallState,
  writeInstallState,
  resolveInstallAction,
} = require("./lib/electron/install-state")
const { startServer, killServer, waitForServer } = require("./lib/electron/server-manager")
const {
  createWindow,
  showNotification,
  setQuitting,
  getMainWindow,
} = require("./lib/electron/window-manager")
const {
  getTemplateDatabaseFileName,
  getTemplateDatabasePath,
  isDev,
} = require("./lib/electron/utils")

let appPort = process.env.PORT || "5000"
let dbPath = null
const installStatePath = path.join(app.getPath("userData"), INSTALL_STATE_FILE)
const logDir = path.join(app.getPath("userData"), "logs")
const logFile = path.join(logDir, "desktop.log")

function logDesktop(message) {
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`)
  } catch {
    console.warn("[desktop] logDesktop failed", message)
  }
}

/**
 * Detecta si es la primera ejecución de la app en este perfil. Sólo en ese caso
 * la base de datos local se crea limpia con el usuario admin por defecto; las
 * actualizaciones y reinstalaciones conservan los datos existentes.
 */
function detectDesktopInstall() {
  if (isDev) {
    return { reset: false, reason: "dev", installerInstallId: null, previousState: null }
  }

  const installerInstallId = readInstallerInstallId()
  const previousState = readInstallState(installStatePath)
  const action = resolveInstallAction({
    isDev: false,
    currentVersion: app.getVersion(),
    installerInstallId,
    previousState,
  })

  return { ...action, installerInstallId, previousState }
}

// Cargar CLOUD_URL desde .env si existe
try {
  const envPath = path.join(__dirname, ".env")
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8")
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIdx = trimmed.indexOf("=")
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim()
          const val = trimmed
            .slice(eqIdx + 1)
            .trim()
            .replace(/^["']|["']$/g, "")
          if (!process.env[key]) process.env[key] = val
        }
      }
    }
  }
} catch (e) {
  console.warn("[desktop] Failed to load .env:", e?.message)
}

process.env.ELECTRON_LOG_FILE = logFile
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    const existingWindow = getMainWindow()
    if (existingWindow) {
      if (existingWindow.isMinimized()) existingWindow.restore()
      if (!existingWindow.isVisible()) existingWindow.show()
      existingWindow.focus()
    } else {
      createWindow(appPort)
    }
  })
}

app.on("ready", async () => {
  logDesktop("[main] app ready")
  dbPath = path.join(app.getPath("userData"), getTemplateDatabaseFileName())
  async function resolveAvailablePort(preferredPort) {
    const isFree = (port) =>
      new Promise((resolve) => {
        const server = net.createServer()
        server.once("error", () => resolve(false))
        server.once("listening", () => {
          server.close(() => resolve(true))
        })
        server.listen(Number(port), "127.0.0.1")
      })

    if (await isFree(preferredPort)) return preferredPort

    for (let p = 5001; p <= 5050; p++) {
      if (await isFree(String(p))) return String(p)
    }
    return preferredPort
  }

  appPort = await resolveAvailablePort(appPort)
  logDesktop(`[main] selected port ${appPort}`)

  setupAutoUpdater()

  // 1. Inicializar DB
  //    Sólo en la primera ejecución del perfil se crea la base limpia con el
  //    esquema base. La cuenta administradora se crea en la configuración inicial.
  //    Las actualizaciones conservan datos y credenciales.
  const install = detectDesktopInstall()
  let wiped = false
  let backupPath = null

  try {
    const result = await ensureDesktopDatabase(dbPath, getTemplateDatabasePath(), {
      resetDatabase: install.reset,
    })
    wiped = result.wiped
    backupPath = result.backupPath
  } catch (error) {
    logDesktop(`[main] Error al preparar la base de datos: ${error?.message || error}`)
    dialog.showErrorBox(
      "Base de datos",
      `No se pudo preparar la base de datos local:\n${error?.message || error}`,
    )
  }

  writeInstallState(installStatePath, {
    version: app.getVersion(),
    installId: install.installerInstallId,
    installedAt: install.reset
      ? new Date().toISOString()
      : install.previousState?.installedAt || new Date().toISOString(),
    lastResetReason: install.reset
      ? install.reason
      : install.previousState?.lastResetReason || null,
    lastStartedAt: new Date().toISOString(),
  })

  if (install.reset) {
    logDesktop(`[main] nueva instalación detectada (${install.reason}): DB local reiniciada`)
    if (wiped) {
      logDesktop(`[main] backup previo de la DB: ${backupPath || "no generado"}`)
    }
  }
  logDesktop(`[main] database ready at ${dbPath}`)

  // 2. El server de Next es el único backend (páginas + API routes).
  //    La app no tiene un canal IPC de datos: el renderer llama al HTTP API,
  //    igual que la web.
  createWindow(appPort)
  try {
    await startServer(appPort, dbPath, () => {
      const win = createWindow(appPort)
      win.loadURL(`http://localhost:${appPort}/login?desktop=1&ts=${Date.now()}`)
    })
  } catch (e) {
    dialog.showErrorBox("Error", `No se pudo iniciar el servidor: ${e.message}`)
  }

  // 3. Esperar servidor y forzar carga/reintento de la UI
  waitForServer(appPort).then((isReady) => {
    const win = getMainWindow() || createWindow(appPort)
    if (isReady) {
      logDesktop("[main] waitForServer ready=true")
      win.loadURL(`http://localhost:${appPort}/login?desktop=1&ts=${Date.now()}`)
      return
    }
    logDesktop("[main] waitForServer ready=false")
    dialog.showErrorBox(
      "Error de inicio",
      `No se pudo iniciar la interfaz web en http://localhost:${appPort}.`,
    )
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    killServer()
    app.quit()
  }
})

app.on("before-quit", () => setQuitting(true))
app.on("activate", () => createWindow(appPort))

// --- Auto Updater ---
let updateDownloaded = false

function setupAutoUpdater() {
  const { autoUpdater } = require("electron-updater")
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on("checking-for-update", () => {
    logDesktop("[updater] checking for updates")
  })

  autoUpdater.on("update-available", (info) => {
    logDesktop(`[updater] update available: ${info.version}`)
    const win = getMainWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send("update-available", info)
    }
  })

  autoUpdater.on("update-not-available", () => {
    logDesktop("[updater] no update available")
  })

  autoUpdater.on("download-progress", (progress) => {
    const win = getMainWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send("update-download-progress", {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      })
    }
  })

  autoUpdater.on("update-downloaded", (info) => {
    logDesktop(`[updater] update downloaded: ${info.version}`)
    updateDownloaded = true
    const win = getMainWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send("update-downloaded", info)
    }
  })

  autoUpdater.on("error", (err) => {
    logDesktop(`[updater] error: ${err.message}`)
  })

  try {
    autoUpdater.checkForUpdatesAndNotify()
  } catch (e) {
    logDesktop(`[updater] check error: ${e.message}`)
  }
}

// --- Handlers IPC ---
ipcMain.handle("show-notification", (_, args) => showNotification(args.title, args.body))
ipcMain.handle("check-for-updates", async () => {
  try {
    const { autoUpdater } = require("electron-updater")
    const result = await autoUpdater.checkForUpdatesAndNotify()
    return { success: true, updateAvailable: !!result }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle("quit-and-install", async () => {
  const { autoUpdater } = require("electron-updater")
  if (updateDownloaded) {
    autoUpdater.quitAndInstall()
  }
  return { installed: updateDownloaded }
})

ipcMain.handle("backup-database", async () => {
  try {
    const targetWindow = getMainWindow()
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const defaultPath = path.join(app.getPath("downloads"), `renault-backup-${timestamp}.db`)

    const result = await dialog.showSaveDialog(targetWindow || undefined, {
      title: "Guardar backup de base de datos",
      defaultPath,
      filters: [{ name: "SQLite Database", extensions: ["db", "sqlite", "sqlite3"] }],
    })

    if (result.canceled || !result.filePath) {
      return { success: false, cancelled: true }
    }

    fs.copyFileSync(dbPath, result.filePath)
    return { success: true, path: result.filePath }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo crear el backup",
    }
  }
})

ipcMain.handle("save-backup-json", async (_, { content, defaultFileName } = {}) => {
  try {
    if (typeof content !== "string" || content.length === 0) {
      return { success: false, error: "Contenido de backup inválido" }
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const suggestedName = defaultFileName || `renault-backup-${timestamp}.json`

    const result = await dialog.showSaveDialog(getMainWindow() || undefined, {
      title: "Guardar backup JSON",
      defaultPath: path.join(app.getPath("downloads"), suggestedName),
      filters: [{ name: "Backup JSON", extensions: ["json"] }],
    })

    if (result.canceled || !result.filePath) {
      return { success: false, cancelled: true }
    }

    fs.writeFileSync(result.filePath, content, "utf8")
    return { success: true, path: result.filePath }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo guardar el backup",
    }
  }
})

ipcMain.handle("pick-backup-json", async () => {
  try {
    const result = await dialog.showOpenDialog(getMainWindow() || undefined, {
      title: "Seleccionar backup JSON",
      filters: [{ name: "Backup JSON", extensions: ["json"] }],
      properties: ["openFile"],
    })

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { success: false, cancelled: true }
    }

    const filePath = result.filePaths[0]
    const content = fs.readFileSync(filePath, "utf8")
    return { success: true, path: filePath, content }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo leer el backup",
    }
  }
})

// La restauración de un backup vive en `/api/backup/restore`; el escritorio usa
// ese mismo endpoint (JSON o `.db` multipart) en vez de reemplazar el archivo.
ipcMain.handle("get-printers", async () => {
  const win = getMainWindow()
  return win ? await win.webContents.getPrintersAsync() : []
})

ipcMain.handle("print-ticket", async (_, { htmlContent, printerName }) => {
  const { BrowserWindow } = require("electron")
  const pWin = new BrowserWindow({
    show: true,
    width: 900,
    height: 1000,
    autoHideMenuBar: false,
    title: "Vista previa de impresión",
    webPreferences: { backgroundThrottling: false },
  })

  await pWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)
  pWin.focus()

  // Pequeña pausa para que el contenido se renderice completamente
  await new Promise((resolve) => setTimeout(resolve, 400))

  // Abre el diálogo de impresión nativo de Chromium con preview visual.
  // El usuario ve la preview, elige impresora/configuración y confirma o cancela.
  const printOptions = {
    printBackground: true,
    ...(printerName ? { deviceName: printerName } : {}),
  }

  // Usar la versión callback para compatibilidad amplia de Electron
  try {
    pWin.webContents.print(printOptions, (success, failureReason) => {
      if (!success && failureReason) {
        logDesktop(`[print-ticket] ${failureReason}`)
      }
      if (!pWin.isDestroyed()) pWin.close()
    })
  } catch (printError) {
    logDesktop(`[print-ticket] error al abrir impresión: ${printError.message}`)
    if (!pWin.isDestroyed()) pWin.close()
  }

  return { success: true }
})

ipcMain.handle("export-ticket-pdf", async (_, { htmlContent, defaultFileName }) => {
  const { BrowserWindow } = require("electron")
  const exportWindow = new BrowserWindow({
    show: false,
    width: 900,
    height: 1000,
    webPreferences: {
      backgroundThrottling: false,
    },
  })

  try {
    await exportWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

    const pdfBuffer = await exportWindow.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const suggestedName = defaultFileName || `export-${timestamp}.pdf`
    const result = await dialog.showSaveDialog(getMainWindow() || undefined, {
      title: "Guardar PDF",
      defaultPath: path.join(app.getPath("downloads"), suggestedName),
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    })

    if (result.canceled || !result.filePath) {
      return { success: false, cancelled: true }
    }

    fs.writeFileSync(result.filePath, pdfBuffer)
    return { success: true, path: result.filePath }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo exportar el PDF",
    }
  } finally {
    exportWindow.close()
  }
})
