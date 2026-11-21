"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { getRoleDisplayName } from "@/lib/role-utils"

interface ProfileData {
  firstName: string
  lastName: string
  ci: string
  phone: string
  address: string
  email: string
}

const buildAvatarUrl = (image: string, version = Date.now()) =>
  `/api/auth/profile/avatar?name=${encodeURIComponent(image)}&t=${version}`

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()

  const capitalize = (text: string) =>
    text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

  const [profile, setProfile] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    ci: "",
    phone: "",
    address: "",
    email: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [removingPhoto, setRemovingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Password change
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    async function loadProfile() {
      try {
        const userId = String(user!.id)
        const res = await fetch(`/api/users/${userId}`, { credentials: "include" })

        if (!res.ok) {
          console.error("[profile] Error al cargar perfil:", res.status)
          return
        }

        const data = await res.json()

        setProfile({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          ci: data.ci || "",
          phone: data.phone || "",
          address: data.address || "",
          email: data.email || "",
        })
        if (data.image) {
          setAvatar(data.image)
          setAvatarPreview(buildAvatarUrl(data.image))
        }
      } catch (err) {
        console.error("[profile] Error cargando perfil:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [user, router])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "La imagen no debe superar 5MB" })
      return
    }

    setAvatarFile(file)
    setRemovingPhoto(false)
    // Preview local
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemovingPhoto(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsSaving(true)

    try {
      // 1. Subir avatar si hay archivo nuevo
      if (avatarFile) {
        const formData = new FormData()
        formData.append("avatar", avatarFile)
        const avatarRes = await fetch("/api/auth/profile/avatar", {
          method: "POST",
          credentials: "include",
          body: formData,
        })
        if (!avatarRes.ok) {
          const err = await avatarRes.json()
          throw new Error(err.error || "Error al subir la foto")
        }

        const avatarData = await avatarRes.json()
        if (avatarData.image) {
          setAvatar(avatarData.image)
          setAvatarPreview(buildAvatarUrl(avatarData.image))
          updateUser({ image: avatarData.image })
          window.dispatchEvent(new CustomEvent("profile-avatar-updated"))
        }
      }

      // 2. Eliminar avatar si se pidió
      if (removingPhoto) {
        const removeRes = await fetch("/api/auth/profile/avatar", {
          method: "DELETE",
          credentials: "include",
        })
        if (removeRes.ok) {
          setAvatar(null)
          setAvatarPreview(null)
          updateUser({ image: null })
          window.dispatchEvent(new CustomEvent("profile-avatar-updated"))
        }
      }

      // 3. Guardar datos del perfil
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profile),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar")
      }

      setAvatarFile(null)
      setRemovingPhoto(false)
      setMessage({ type: "success", text: "Perfil actualizado correctamente" })

      // Refrescar preview desde el servidor
      if (data.user?.image) {
        setAvatar(data.user.image)
        setAvatarPreview(buildAvatarUrl(data.user.image))
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error al guardar" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (!currentPassword || !newPassword) {
      setPasswordMessage({ type: "error", text: "Completá ambos campos" })
      return
    }

    setIsChangingPassword(true)

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al cambiar contraseña")
      }

      setPasswordMessage({ type: "success", text: "Contraseña actualizada correctamente" })
      setCurrentPassword("")
      setNewPassword("")
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Error al cambiar contraseña",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
          Mi Perfil
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Gestioná tu información personal y seguridad
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Información Personal */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100">Información Personal</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Tus datos de contacto</p>
            </div>
          </div>

          {/* Foto de perfil */}
          <div className="flex flex-col items-center gap-3 py-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Foto de perfil del usuario"
                  width={96}
                  height={96}
                  loading="lazy"
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 group-hover:border-primary/50 transition-all shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 border-4 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center group-hover:border-primary/50 transition-all">
                  <User
                    size={36}
                    className="text-zinc-400 group-hover:text-primary transition-colors"
                  />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-all flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-full transition-all">
                  Cambiar
                </span>
              </div>
            </button>
            <div className="flex gap-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Clic en la foto para cambiarla
              </p>
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>

          {message && (
            <div
              className={`flex items-start gap-3 p-4 rounded-xl text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20"
                  : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              )}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Nombre
                </label>
                <Input
                  value={profile.firstName}
                  onChange={(e) =>
                    setProfile({ ...profile, firstName: capitalize(e.target.value) })
                  }
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Apellido
                </label>
                <Input
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: capitalize(e.target.value) })}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                CI / Documento
              </label>
              <div className="relative">
                <Input
                  value={profile.ci}
                  onChange={(e) => setProfile({ ...profile, ci: e.target.value })}
                  className="h-11 pl-11 rounded-xl"
                  required
                />
                <CreditCard
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Email
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="h-11 pl-11 rounded-xl"
                  required
                />
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Teléfono
              </label>
              <div className="relative">
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="h-11 pl-11 rounded-xl"
                  required
                />
                <Phone
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Dirección
              </label>
              <div className="relative">
                <Input
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: capitalize(e.target.value) })}
                  className="h-11 pl-11 rounded-xl"
                  required
                />
                <MapPin
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
              </div>
            </div>

            <Button type="submit" disabled={isSaving} className="w-full h-12 rounded-xl font-bold">
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> Guardando...
                </span>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </form>
        </div>

        {/* Seguridad */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Lock size={20} className="text-amber-500" />
              </div>
              <div>
                <h2 className="font-bold text-zinc-900 dark:text-zinc-100">Cambiar Contraseña</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Actualizá tu clave de acceso
                </p>
              </div>
            </div>

            {passwordMessage && (
              <div
                className={`flex items-start gap-3 p-4 rounded-xl text-sm font-medium ${
                  passwordMessage.type === "success"
                    ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20"
                    : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20"
                }`}
              >
                {passwordMessage.type === "success" ? (
                  <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                )}
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-11 pl-11 pr-11 rounded-xl"
                    required
                  />
                  <Lock
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 pl-11 pr-11 rounded-xl"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <Lock
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isChangingPassword}
                className="w-full h-12 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isChangingPassword ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Cambiando...
                  </span>
                ) : (
                  "Cambiar Contraseña"
                )}
              </Button>
            </form>
          </div>

          {/* Info del rol */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <ShieldIcon size={20} className="text-zinc-500 dark:text-zinc-400" />
              </div>
              <div>
                <h2 className="font-bold text-zinc-900 dark:text-zinc-100">Tu Rol</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Permisos asignados</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                {user?.role ? getRoleDisplayName(user.role) : "—"}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {user?.role === "administrador"
                  ? "Acceso completo al sistema"
                  : user?.role === "vendedor"
                    ? "Gestión de ventas y clientes"
                    : user?.role === "comprador"
                      ? "Gestión de compras y proveedores"
                      : user?.role === "supervisor"
                        ? "Supervisión de operaciones"
                        : "Acceso limitado"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShieldIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.06 1.06 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
}
