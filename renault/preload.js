const { contextBridge, ipcRenderer } = require("electron")

const isDev = !require("electron").app.isPackaged

contextBridge.exposeInMainWorld("electron", {
  saveDatabase: () => ipcRenderer.invoke("backup-database"),
  saveBackupJson: (content, defaultFileName) =>
    ipcRenderer.invoke("save-backup-json", { content, defaultFileName }),
  pickBackupJson: () => ipcRenderer.invoke("pick-backup-json"),
  showNotification: (title, body) => ipcRenderer.invoke("show-notification", { title, body }),
  getPrinters: () => ipcRenderer.invoke("get-printers"),
  printTicket: (htmlContent, printerName) =>
    ipcRenderer.invoke("print-ticket", { htmlContent, printerName }),
  exportTicketPdf: (htmlContent, defaultFileName) =>
    ipcRenderer.invoke("export-ticket-pdf", { htmlContent, defaultFileName }),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  quitAndInstall: () => ipcRenderer.invoke("quit-and-install"),
  onUpdateAvailable: (callback) => ipcRenderer.on("update-available", (_, info) => callback(info)),
  onUpdateDownloadProgress: (callback) =>
    ipcRenderer.on("update-download-progress", (_, progress) => callback(progress)),
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on("update-downloaded", (_, info) => callback(info)),
  isDev,
})
