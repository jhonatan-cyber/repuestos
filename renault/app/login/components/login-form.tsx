"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, ArrowRight, KeyRound, Eye, EyeOff } from "lucide-react"
import { ForgotPasswordModal } from "./forgot-password-modal"
import { BrandLogo } from "@/components/brand/brand-logo"

export function LoginForm({ needsSetup = false }: { needsSetup?: boolean }) {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(email, password, rememberMe)
      router.push("/dashboard")
    } catch (err) {
      setError("Las credenciales ingresadas son incorrectas. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Efectos decorativos */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradiente suave Púrpura */}
        <div className="absolute top-[-30%] right-[-20%] w-[700px] h-[700px] bg-primary/20 dark:bg-primary/10 blur-[150px] rounded-full" />

        {/* Gradiente suave Ámbar */}
        <div className="absolute bottom-[-30%] left-[-20%] w-[600px] h-[600px] bg-amber-400/20 dark:bg-amber-400/10 blur-[120px] rounded-full" />

        {/* Puntos sutiles flotando */}
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 2px, transparent 2px)",
            backgroundSize: "80px 80px",
            animation: "floatDots 20s linear infinite",
          }}
        />

        {/* Nube de puntos flotando */}
        <div
          className="absolute inset-0 opacity-[0.1] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, currentColor 2px, transparent 2px), radial-gradient(circle at 75% 15%, currentColor 1.5px, transparent 1.5px), radial-gradient(circle at 50% 75%, currentColor 2px, transparent 2px), radial-gradient(circle at 90% 85%, currentColor 1.5px, transparent 1.5px), radial-gradient(circle at 10% 85%, currentColor 1px, transparent 1px), radial-gradient(circle at 65% 45%, currentColor 2px, transparent 2px), radial-gradient(circle at 35% 5%, currentColor 1.5px, transparent 1.5px), radial-gradient(circle at 85% 55%, currentColor 1px, transparent 1px), radial-gradient(circle at 15% 45%, currentColor 2px, transparent 2px), radial-gradient(circle at 55% 95%, currentColor 1px, transparent 1px)",
            backgroundSize: "150px 150px",
            animation: "floatDots 25s linear infinite reverse",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes floatDots {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-30px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>

      <div className="w-full max-w-[420px] relative z-10 space-y-10 animate-in fade-in slide-in-from-bottom-16 duration-[1.5s] delay-200 fill-mode-both">
        {/* Mobile Logo Block */}
        <div className="lg:hidden flex flex-col items-center gap-4 mb-6">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <BrandLogo className="h-full w-full" alt="Renault Logo" />
          </div>
        </div>

        <div className="space-y-3 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Ingresá tus datos
          </h2>
        </div>

        {error && (
          <div className="animate-in fade-in zoom-in-95 duration-400 flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium shadow-sm">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 group">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-primary transition-colors">
              Correo Empresarial
            </label>
            <div className="relative">
              <Input
                type="email"
                placeholder="usuario@empresa.com"
                className="h-14 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus-visible:ring-primary dark:focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl pl-12 text-base shadow-sm dark:shadow-none font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-primary transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2 group">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-primary transition-colors">
                Contraseña de Acceso
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs font-bold text-primary hover:text-amber-600 dark:hover:text-amber-400 transition-colors bg-transparent border-0 cursor-pointer"
              >
                ¿Olvidaste la clave?
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-14 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus-visible:ring-primary dark:focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl pl-12 pr-12 text-lg shadow-sm dark:shadow-none tracking-widest"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-primary transition-colors">
                <KeyRound size={20} className="stroke-[2.5px]" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
                disabled={isLoading}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-3 text-sm shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/40 dark:shadow-none">
            <Label
              htmlFor="remember-me"
              className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300"
            >
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={isLoading}
                className="border-zinc-300 dark:border-white/15"
              />
              <span className="font-semibold">Recuérdame</span>
            </Label>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Mantener sesión al volver a abrir la app
            </span>
          </div>

          {needsSetup && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 my-2 shadow-[0_0_20px_rgba(234,179,8,0.1)] animate-pulse">
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-xs font-bold text-amber-600 dark:text-primary uppercase tracking-widest">
                  ⚠️ Sistema sin configurar
                </p>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.push("/setup")}
                  className="w-full border-amber-500/50 hover:bg-primary hover:text-zinc-950 font-black transition-all h-12 rounded-xl bg-amber-500/5"
                >
                  CREAR ADMINISTRADOR MAESTRO
                </Button>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 mt-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-primary dark:text-zinc-950 dark:hover:bg-amber-400 font-bold text-base leading-none tracking-wide rounded-xl transition-all duration-300 shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(234,179,8,0.3)] hover:shadow-lg dark:hover:shadow-[0_0_50px_rgba(234,179,8,0.5)] transform hover:-translate-y-1 group relative overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/20 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-[shimmer_1.5s_infinite]" />

            {isLoading ? (
              <span className="flex items-center justify-center gap-3 relative z-10">
                <Loader2 size={20} className="animate-spin" />
                AUTENTICANDO...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3 relative z-10">
                INGRESAR AL SISTEMA
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </form>
      </div>

      <ForgotPasswordModal open={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </div>
  )
}
