"use client"

import { useEffect, useState } from "react"
import { Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
}

interface DownloadProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export function UpdateNotifier() {
  const [available, setAvailable] = useState<UpdateInfo | null>(null)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [downloaded, setDownloaded] = useState<UpdateInfo | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).electron) return

    const electron = (window as any).electron

    electron.onUpdateAvailable((info: UpdateInfo) => setAvailable(info))
    electron.onUpdateDownloadProgress((p: DownloadProgress) => setProgress(p))
    electron.onUpdateDownloaded((info: UpdateInfo) => {
      setDownloaded(info)
      setProgress(null)
      setAvailable(null)
    })
  }, [])

  const handleInstall = async () => {
    if ((window as any).electron?.quitAndInstall) {
      await (window as any).electron.quitAndInstall()
    }
  }

  if (progress) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 w-80 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Download className="h-4 w-4 animate-pulse text-primary" />
          <span>Descargando actualización...</span>
        </div>
        <Progress value={progress.percent} className="h-2" />
        <p className="text-xs text-muted-foreground">{progress.percent.toFixed(1)}%</p>
      </div>
    )
  }

  if (downloaded) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 w-80 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <RefreshCw className="h-4 w-4 text-emerald-500" />
          <span>Actualización {downloaded.version} lista</span>
        </div>
        <p className="text-xs text-muted-foreground">Reiniciá la app para aplicar los cambios.</p>
        <Button size="sm" className="w-full gap-2" onClick={handleInstall}>
          <RefreshCw className="h-3 w-3" /> Reiniciar e instalar
        </Button>
      </div>
    )
  }

  if (available) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 w-80 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Download className="h-4 w-4 text-primary" />
          <span>Actualización {available.version} disponible</span>
        </div>
        <p className="text-xs text-muted-foreground">Descargando automáticamente...</p>
      </div>
    )
  }

  return null
}
