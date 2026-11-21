export {}

declare global {
  interface Window {
    electron: {
      saveDatabase: () => Promise<{
        success: boolean
        path?: string
        cancelled?: boolean
        error?: string
      }>
      saveBackupJson: (
        content: string,
        defaultFileName?: string,
      ) => Promise<{ success: boolean; path?: string; cancelled?: boolean; error?: string }>
      pickBackupJson: () => Promise<{
        success: boolean
        path?: string
        content?: string
        cancelled?: boolean
        error?: string
      }>
      showNotification: (title: string, body: string) => Promise<void>
      getPrinters: () => Promise<any[]>
      printTicket: (
        htmlContent: string,
        printerName: string,
      ) => Promise<{ success: boolean; error?: string }>
      exportTicketPdf: (
        htmlContent: string,
        defaultFileName: string,
      ) => Promise<{ success: boolean; path?: string; cancelled?: boolean; error?: string }>
      isDev: boolean
    }
  }
}
