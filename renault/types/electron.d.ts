interface ElectronExportResult {
  success: boolean
  cancelled?: boolean
  error?: string
  path?: string
}

interface ElectronPrintResult {
  success: boolean
  error?: string
}

interface ElectronAPI {
  isDev?: boolean
  saveBackupJson(content: string, defaultFileName?: string): Promise<ElectronExportResult>
  pickBackupJson(): Promise<ElectronExportResult & { content?: string }>
  exportTicketPdf(htmlContent: string, filename: string): Promise<ElectronExportResult>
  printTicket(htmlContent: string, title: string): Promise<ElectronPrintResult>
}

declare global {
  interface Window {
    electron?: ElectronAPI
  }
}
