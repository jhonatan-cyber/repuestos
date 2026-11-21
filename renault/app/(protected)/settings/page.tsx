"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { loadCompanyInfo } from "@/lib/export/shared"
import { apiClient } from "@/lib/api-client"
import { Upload, Save, Loader2, Building2, ImageIcon, DatabaseBackup } from "lucide-react"
import { BackupRestoreCard } from "@/components/settings/backup-restore-card"

interface FormState {
  companyName: string
  companySlogan: string
  companyAddress: string
  companyCity: string
  companyPhone: string
  companyNit: string
}

export default function SettingsPage() {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasLogo, setHasLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    companyName: "",
    companySlogan: "",
    companyAddress: "",
    companyCity: "",
    companyPhone: "",
    companyNit: "",
  })
  const [logoTs, setLogoTs] = useState(Date.now)

  useEffect(() => {
    apiClient<{
      companyName?: string
      companySlogan?: string
      companyAddress?: string
      companyCity?: string
      companyPhone?: string
      companyNit?: string
      hasLogo?: boolean
    }>("/api/settings/company")
      .then((data) => {
        setForm({
          companyName: data.companyName ?? "",
          companySlogan: data.companySlogan ?? "",
          companyAddress: data.companyAddress ?? "",
          companyCity: data.companyCity ?? "",
          companyPhone: data.companyPhone ?? "",
          companyNit: data.companyNit ?? "",
        })
        setHasLogo(data.hasLogo ?? false)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({ title: "Solo imágenes", variant: "destructive" })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Máximo 2MB", variant: "destructive" })
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const uploadLogo = async () => {
    const file = inputRef.current?.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("logo", file)
    try {
      await apiClient("/api/settings/logo", { method: "POST", body: fd })
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Error al subir logo",
        variant: "destructive",
      })
      return
    }
    setHasLogo(true)
    setLogoPreview(null)
    setLogoTs(Date.now())
    if (inputRef.current) inputRef.current.value = ""
    toast({ title: "Logo actualizado" })
  }

  const saveCompany = async () => {
    setSaving(true)
    try {
      await apiClient("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      loadCompanyInfo()
      toast({ title: "Configuración guardada" })
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona los datos de la empresa, apariencia y respaldo de datos
        </p>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList className="w-full">
          <TabsTrigger value="empresa" className="flex items-center gap-2 flex-1">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="logo" className="flex items-center gap-2 flex-1">
            <ImageIcon className="h-4 w-4" />
            Logo
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2 flex-1">
            <DatabaseBackup className="h-4 w-4" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Empresa ── */}
        <TabsContent value="empresa" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos de la empresa</CardTitle>
              <CardDescription>Aparecen en facturas, recibos y exportaciones.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nombre</Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companySlogan">Eslogan</Label>
                  <Input
                    id="companySlogan"
                    value={form.companySlogan}
                    onChange={(e) => setForm({ ...form, companySlogan: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyAddress">Dirección</Label>
                  <Input
                    id="companyAddress"
                    value={form.companyAddress}
                    onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyCity">Ciudad</Label>
                  <Input
                    id="companyCity"
                    value={form.companyCity}
                    onChange={(e) => setForm({ ...form, companyCity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Teléfono</Label>
                  <Input
                    id="companyPhone"
                    value={form.companyPhone}
                    onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyNit">NIT</Label>
                  <Input
                    id="companyNit"
                    value={form.companyNit}
                    onChange={(e) => setForm({ ...form, companyNit: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={saveCompany} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Logo ── */}
        <TabsContent value="logo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Logo del sistema</CardTitle>
              <CardDescription>
                PNG, JPG o WebP, máximo 2MB. Se usará en todas las exportaciones e interfaz.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden bg-white flex items-center justify-center shrink-0">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Vista previa del logo de la empresa"
                      width={96}
                      height={96}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  ) : hasLogo ? (
                    <img
                      src={`/api/settings/logo?t=${logoTs}`}
                      alt="Logo actual de la empresa"
                      width={96}
                      height={96}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground text-center px-2">Sin logo</span>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {hasLogo
                      ? "Logo actual cargado. Puedes reemplazarlo."
                      : "No hay logo cargado aún."}
                  </p>
                  <Input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    className="max-w-64"
                  />
                  <Button size="sm" onClick={uploadLogo} disabled={!logoPreview}>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir logo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Backup ── */}
        <TabsContent value="backup" className="mt-4">
          <BackupRestoreCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
