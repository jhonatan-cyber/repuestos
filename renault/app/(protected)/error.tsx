"use client"

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center" role="alert">
      <h2 className="text-lg font-semibold">Algo salió mal</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message ||
          "No se pudo cargar esta sección. Verificá tu conexión e intentá de nuevo."}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Reintentar
      </button>
    </div>
  )
}
