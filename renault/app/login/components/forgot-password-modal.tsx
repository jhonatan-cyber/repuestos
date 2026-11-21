"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle2, Loader2, Mail, X } from "lucide-react"

interface ForgotPasswordModalProps {
  open: boolean
  onClose: () => void
}

export function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<"input" | "confirm" | "loading" | "success" | "error">("input")
  const [errorMsg, setErrorMsg] = useState("")

  if (!open) return null

  const handleContinue = () => {
    if (!email.trim()) {
      setErrorMsg("Ingresá tu correo empresarial")
      return
    }
    setErrorMsg("")
    setStep("confirm")
  }

  const handleReset = async () => {
    setStep("loading")
    setErrorMsg("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al resetear")
      }

      setStep("success")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al resetear la contraseña")
      setStep("error")
    }
  }

  const handleClose = () => {
    setEmail("")
    setStep("input")
    setErrorMsg("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            ¿Olvidaste tu contraseña?
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {step === "input" && (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Ingresá tu correo empresarial. Te mostraremos cómo recuperar el acceso.
              </p>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrorMsg("")
                  }}
                  className="h-12 pl-11 rounded-xl"
                  autoFocus
                />
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
              </div>
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <Button onClick={handleContinue} className="w-full h-12 rounded-xl font-bold">
                Continuar
              </Button>
            </>
          )}

          {step === "confirm" && (
            <>
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                  Se reseteará tu contraseña al <strong className="font-black">número de CI</strong>{" "}
                  registrado en el sistema para el usuario:
                </p>
                <p className="mt-2 text-base font-bold text-amber-900 dark:text-amber-200">
                  {email}
                </p>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Después de ingresar, podés cambiar tu contraseña desde tu perfil.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("input")}
                  className="flex-1 h-12 rounded-xl"
                >
                  Volver
                </Button>
                <Button
                  onClick={handleReset}
                  className="flex-1 h-12 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Sí, resetear
                </Button>
              </div>
            </>
          )}

          {step === "loading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={40} className="animate-spin text-primary" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Reseteando contraseña...</p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">¡Contraseña reseteada!</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Tu nueva contraseña es tu <strong>número de CI</strong>.
                  <br />
                  Ingresá con ese dato y cambiala desde tu perfil.
                </p>
              </div>
              <Button onClick={handleClose} className="w-full h-12 rounded-xl font-bold mt-2">
                Entendido
              </Button>
            </div>
          )}

          {step === "error" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1 h-12 rounded-xl">
                  Cerrar
                </Button>
                <Button
                  onClick={() => setStep("input")}
                  className="flex-1 h-12 rounded-xl font-bold"
                >
                  Intentar de nuevo
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
