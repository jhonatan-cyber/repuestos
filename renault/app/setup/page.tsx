"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { ShieldCheck, UserPlus, Mail, Fingerprint, Loader2, Rocket } from "lucide-react"
import { toast } from "@/lib/toast"

// Esquema de validación
const setupSchema = z.object({
  ci: z.string().min(5, "El CI debe tener al menos 5 caracteres"),
  firstName: z.string().min(2, "El nombre es muy corto"),
  lastName: z.string().min(2, "El apellido es muy corto"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type SetupValues = z.infer<typeof setupSchema>

export default function SetupPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. Verificar si el setup es necesario
  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch("/api/auth/setup/check")
        const data = await res.json()
        if (!data.needsSetup) {
          router.push("/login")
        }
      } catch (error) {
        console.error("Check setup failed", error)
      } finally {
        setIsChecking(false)
      }
    }
    checkSetup()
  }, [router])

  const form = useForm<SetupValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      ci: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  // 2. Procesar el setup
  async function onSubmit(values: SetupValues) {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ci: values.ci,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al configurar el sistema")
      }

      toast.success("¡Sistema configurado con éxito!")
      toast.info("Inicia sesión con el correo y la contraseña que elegiste")

      // Pequeña espera para que el toast sea visible
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error: any) {
      toast.error(error.message)
      setIsSubmitting(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-lg space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-[0_0_20px_rgba(234,179,8,0.4)]">
              <Rocket className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
            ¡Bienvenido a Renault!
          </h1>
          <p className="text-slate-500 dark:text-zinc-400">
            Estamos listos para despegar. Creemos tu cuenta de administrador.
          </p>
        </div>

        <Card className="border-slate-200/50 dark:border-zinc-800/50 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Primer Administrador
            </CardTitle>
            <CardDescription>
              Este usuario tendrá control total sobre todos los módulos del ERP.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserPlus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Ej. Juan"
                              className="pl-10"
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value
                                const capitalized = val.replace(/\b\w/g, (l) => l.toUpperCase())
                                field.onChange(capitalized)
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserPlus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Ej. Pérez"
                              className="pl-10"
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value
                                const capitalized = val.replace(/\b\w/g, (l) => l.toUpperCase())
                                field.onChange(capitalized)
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ci"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cédula de Identidad (CI)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Fingerprint className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Número de documento" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="admin@renault.com" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="Mínimo 8 caracteres"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full mt-6 h-12 text-lg font-bold shadow-lg shadow-primary/20"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Configurando sistema...
                    </>
                  ) : (
                    "Iniciar Sistema"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-100 dark:border-zinc-800/50 mt-2 py-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Renault Repuestos Automotrices © 2026
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
