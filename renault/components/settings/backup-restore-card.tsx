"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Download,
  Upload,
  Loader2,
  DatabaseBackup,
  ShieldAlert,
  CheckCircle2,
  FileJson,
  HardDrive,
} from "lucide-react"

interface RestoreStats {
  totalRecords: number
  stats: Record<string, number>
}

const SQLITE_EXTENSIONS = [".db", ".sqlite", ".sqlite3"]

function isSqliteBackupFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return SQLITE_EXTENSIONS.some((extension) => name.endsWith(extension))
}

/**
 * Respaldo/restauración unificada:
 * - JSON: formato portable, funciona igual en web y en escritorio. En escritorio
 *   el archivo se guarda/lee con el diálogo nativo, pero el contenido lo genera y
 *   valida el API route (`/api/backup` y `/api/backup/restore`).
 * - `.db`: copia cruda de la base SQLite. Sólo se puede generar en escritorio,
 *   y se restaura igual en web y en escritorio: el API route la convierte al
 *   mismo payload JSON (`multipart/form-data`) y la aplica en una transacción.
 */
export function BackupRestoreCard() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dbInputRef = useRef<HTMLInputElement>(null)

  const isElectronEnv = typeof window !== "undefined" && !!window.electron?.saveDatabase

  const [isBackingUpJson, setIsBackingUpJson] = useState(false)
  const [isBackingUpDb, setIsBackingUpDb] = useState(false)
  const [isRestoringJson, setIsRestoringJson] = useState(false)
  const [isRestoringDb, setIsRestoringDb] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [restoreResult, setRestoreResult] = useState<RestoreStats | null>(null)

  async function readBackupResponse(res: Response): Promise<string | null> {
    if (res.ok) return res.text()

    let errMsg = `Error ${res.status}`
    try {
      const err = await res.json()
      errMsg = err.error || errMsg
    } catch {
      /* respuesta no JSON */
    }
    toast({ title: errMsg, variant: "destructive" })
    return null
  }

  // ── Backup ──────────────────────────────────────────────────────────────
  const handleJsonBackup = async () => {
    setIsBackingUpJson(true)
    try {
      const res = await fetch("/api/backup", { credentials: "include" })
      const text = await readBackupResponse(res)
      if (text === null) return

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const filename = `renault-backup-${timestamp}.json`

      // Escritorio: diálogo nativo, mismo JSON que genera la web.
      if (isElectronEnv && window.electron?.saveBackupJson) {
        const result = await window.electron.saveBackupJson(text, filename)
        if (result.cancelled) return
        if (!result.success) {
          toast({ title: result.error || "Error al guardar el backup", variant: "destructive" })
          return
        }
        toast({ title: "Backup guardado", description: result.path })
        return
      }

      // Web: descarga directa.
      const blob = new Blob([text], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.style.display = "none"
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 200)

      toast({ title: "Backup generado", description: `Archivo guardado: ${filename}` })
    } catch (err) {
      console.error("[backup]", err)
      toast({ title: "Error al generar el backup", variant: "destructive" })
    } finally {
      setIsBackingUpJson(false)
    }
  }

  const handleDbBackup = async () => {
    setIsBackingUpDb(true)
    try {
      const result = await window.electron?.saveDatabase?.()
      if (!result || result.cancelled) return
      if (!result.success) {
        toast({ title: result.error || "Error al generar backup", variant: "destructive" })
        return
      }
      toast({ title: "Copia SQLite guardada", description: result.path })
    } catch (err) {
      console.error("[backup:db]", err)
      toast({ title: "Error al generar la copia SQLite", variant: "destructive" })
    } finally {
      setIsBackingUpDb(false)
    }
  }

  // ── Restore ─────────────────────────────────────────────────────────────
  async function applyRestoreResponse(res: Response) {
    let result: { error?: string; totalRecords?: number; stats?: Record<string, number> } = {}
    try {
      result = await res.json()
    } catch {
      /* respuesta no JSON */
    }

    if (!res.ok) {
      toast({ title: result.error || "Error al restaurar", variant: "destructive" })
      return
    }

    setRestoreResult({ totalRecords: result.totalRecords ?? 0, stats: result.stats ?? {} })
    toast({
      title: "Base de datos restaurada",
      description: `${result.totalRecords ?? 0} registros restaurados`,
    })

    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function restoreFromJson(text: string) {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      toast({ title: "El archivo no es un JSON válido", variant: "destructive" })
      return
    }

    const res = await fetch("/api/backup/restore", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    })

    await applyRestoreResponse(res)
  }

  /** Copia SQLite (.db): se sube y el servidor la convierte al payload JSON. */
  async function restoreFromSqliteFile(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/backup/restore", {
      method: "POST",
      credentials: "include",
      body: formData,
    })

    await applyRestoreResponse(res)
  }

  const handleJsonRestore = async () => {
    setIsRestoringJson(true)
    setRestoreResult(null)
    try {
      // Escritorio: selector nativo, pero la restauración la hace el API route.
      if (isElectronEnv && window.electron?.pickBackupJson) {
        const picked = await window.electron.pickBackupJson()
        if (!picked || picked.cancelled) return
        if (!picked.success || typeof picked.content !== "string") {
          toast({ title: picked.error || "No se pudo leer el archivo", variant: "destructive" })
          return
        }
        await restoreFromJson(picked.content)
        return
      }

      if (!selectedFile) return
      if (isSqliteBackupFile(selectedFile)) {
        await restoreFromSqliteFile(selectedFile)
        return
      }
      await restoreFromJson(await selectedFile.text())
    } catch (err) {
      console.error("[restore]", err)
      toast({ title: "Error al restaurar", variant: "destructive" })
    } finally {
      setIsRestoringJson(false)
    }
  }

  /** Escritorio: el selector elige el `.db`, pero restaura el mismo API route que la web. */
  const handleDbFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    if (!isSqliteBackupFile(file)) {
      toast({ title: "Seleccioná un archivo .db", variant: "destructive" })
      return
    }

    setIsRestoringDb(true)
    setRestoreResult(null)
    try {
      await restoreFromSqliteFile(file)
    } catch (err) {
      console.error("[restore:db]", err)
      toast({ title: "Error al restaurar la copia SQLite", variant: "destructive" })
    } finally {
      setIsRestoringDb(false)
    }
  }

  // ── File selection (web) ────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isSqliteBackupFile(file) && !file.name.toLowerCase().endsWith(".json")) {
      toast({ title: "Solo se aceptan archivos .json o .db", variant: "destructive" })
      return
    }

    setSelectedFile(file)
    setRestoreResult(null)
  }

  const clearFile = () => {
    setSelectedFile(null)
    setRestoreResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DatabaseBackup className="h-5 w-5" />
          Backup y Restauración
        </CardTitle>
        <CardDescription>
          El backup JSON es portable: sirve para respaldar y restaurar tanto en la web como en la
          app de escritorio. La copia <code>.db</code> se genera en escritorio y también se puede
          restaurar desde la web.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Backup section */}
        <div className="rounded-lg border border-slate-200 dark:border-zinc-700 p-4 space-y-3">
          <div>
            <p className="font-medium text-sm">Generar backup</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Archivo JSON con toda la información del sistema (clientes, ventas, productos, etc.).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleJsonBackup}
              disabled={isBackingUpJson}
              variant="outline"
              size="sm"
            >
              {isBackingUpJson ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isBackingUpJson ? "Generando..." : "Backup JSON"}
            </Button>

            {isElectronEnv && (
              <Button
                onClick={handleDbBackup}
                disabled={isBackingUpDb || isBackingUpJson}
                variant="outline"
                size="sm"
              >
                {isBackingUpDb ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <HardDrive className="h-4 w-4 mr-2" />
                )}
                {isBackingUpDb ? "Copiando..." : "Copia SQLite (.db)"}
              </Button>
            )}
          </div>
          {isElectronEnv && (
            <p className="text-xs text-muted-foreground">
              La copia <code>.db</code> es una imagen completa de la base local. Se restaura igual
              en escritorio y en web: se convierte al formato JSON interno y se aplica en una
              transacción.
            </p>
          )}
        </div>

        {/* Restore section */}
        <div className="rounded-lg border border-slate-200 dark:border-zinc-700 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Restaurar desde backup</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="text-amber-600 dark:text-amber-400 font-medium">Atención: </span>
                esta acción reemplaza <strong>todos</strong> los datos actuales con los del archivo.
                No se puede deshacer.
              </p>
            </div>
          </div>

          {isElectronEnv ? (
            /* Escritorio: JSON portable + copia .db */
            <div className="space-y-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isRestoringJson}>
                    {isRestoringJson ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileJson className="h-4 w-4 mr-2" />
                    )}
                    {isRestoringJson ? "Restaurando..." : "Restaurar backup JSON"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar restauración?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-2">
                        <p>
                          Se abrirá un selector para elegir un backup <code>.json</code>. Todos los
                          datos actuales serán reemplazados por los del archivo.
                        </p>
                        <p className="text-amber-600 dark:text-amber-400 font-medium">
                          Esta acción no se puede deshacer. Asegúrate de tener un backup reciente.
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleJsonRestore}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sí, restaurar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isRestoringDb}>
                    {isRestoringDb ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isRestoringDb ? "Restaurando..." : "Restaurar copia SQLite (.db)"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar restauración de la copia .db?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-2">
                        <p>
                          Se abrirá un selector para elegir el backup <code>.db</code>. Todos los
                          datos actuales serán reemplazados por los del archivo.
                        </p>
                        <p className="text-amber-600 dark:text-amber-400 font-medium">
                          Esta acción no se puede deshacer. Si algo falla durante la restauración,
                          los datos actuales se conservan.
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => dbInputRef.current?.click()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sí, restaurar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <input
                ref={dbInputRef}
                type="file"
                accept=".db,.sqlite,.sqlite3,application/vnd.sqlite3,application/x-sqlite3"
                onChange={handleDbFilePicked}
                className="hidden"
              />
            </div>
          ) : (
            /* Web: selector de archivo JSON + confirmación */
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRestoringJson}
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  {selectedFile ? "Cambiar archivo" : "Seleccionar archivo .json o .db"}
                </Button>
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate max-w-50">{selectedFile.name}</span>
                    <button
                      onClick={clearFile}
                      className="text-xs text-red-500 hover:underline"
                      disabled={isRestoringJson}
                    >
                      quitar
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.db,.sqlite,.sqlite3,application/json,application/vnd.sqlite3,application/x-sqlite3"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {selectedFile && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isRestoringJson}>
                      {isRestoringJson ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {isRestoringJson ? "Restaurando..." : "Restaurar base de datos"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Confirmar restauración?</AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-2">
                          <p>
                            Se eliminarán <strong>todos los datos actuales</strong> y serán
                            reemplazados por los del archivo:
                          </p>
                          <p className="font-mono text-sm bg-muted rounded px-2 py-1 break-all">
                            {selectedFile.name}
                          </p>
                          <p className="text-amber-600 dark:text-amber-400 font-medium">
                            Esta acción no se puede deshacer. Asegúrate de tener un backup reciente.
                          </p>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleJsonRestore}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sí, restaurar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </div>

        {/* Restore result */}
        {restoreResult && (
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium text-sm">
                Restauración completada — {restoreResult.totalRecords} registros
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
              {Object.entries(restoreResult.stats)
                .filter(([, count]) => count > 0)
                .map(([model, count]) => (
                  <span key={model}>
                    {model}: <strong>{count}</strong>
                  </span>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
