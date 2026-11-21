"use client"

import { useEffect, useRef, useState } from "react"
import { logger } from "@/lib/logger"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { X, Camera } from "lucide-react"

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const html5QrCode = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const startScanner = async () => {
      try {
        html5QrCode.current = new Html5Qrcode("reader")

        const config = {
          fps: 10,
          qrbox: { width: 280, height: 160 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
          ],
        }

        await html5QrCode.current.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            onScan(decodedText)
            stopScanner()
          },
          (errorMessage) => {
            // Ignore frequent scan errors
          },
        )
      } catch (err) {
        logger.error("Error starting scanner", { error: err instanceof Error ? err.message : err })
        setError(
          "No se pudo acceder a la cámara. Por favor, asegúrate de dar los permisos necesarios.",
        )
      }
    }

    startScanner()

    return () => {
      stopScanner()
    }
  }, [onScan])

  const stopScanner = async () => {
    if (html5QrCode.current && html5QrCode.current.isScanning) {
      try {
        await html5QrCode.current.stop()
        html5QrCode.current.clear()
      } catch (err) {
        logger.error("Error stopping scanner", { error: err instanceof Error ? err.message : err })
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="absolute top-6 right-6 z-[110]">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 h-12 w-12"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="w-full max-w-sm px-6 flex flex-col items-center gap-8">
        <div className="relative w-full aspect-square bg-black rounded-[3rem] overflow-hidden border-4 border-white/5 shadow-[0_0_80px_rgba(234,179,8,0.15)] flex items-center justify-center">
          <div
            id="reader"
            className="w-[120%] h-[120%] absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
          ></div>

          {/* Scanner Overlay UI */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
            {/* Corner markers */}
            <div className="w-72 h-44 relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>

              {/* Scanning line */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_rgba(234,179,8,1)] animate-scan-line"></div>
              </div>
            </div>
          </div>

          {/* Background darkening */}
          <div className="absolute inset-0 bg-black/40 pointer-events-none z-0"></div>
        </div>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-primary/10 border border-primary/30 mb-2 relative group">
            <Camera className="h-8 w-8 text-primary transition-transform duration-500 group-hover:scale-110" />
            <span className="absolute inset-0 rounded-[1.5rem] border border-primary animate-ping opacity-20"></span>
          </div>
          <div className="space-y-1">
            <h3 className="text-white font-black text-2xl tracking-tight uppercase">
              Scanner <span className="text-primary italic">Expert</span>
            </h3>
            <p className="text-zinc-500 text-sm font-medium px-4 leading-snug">
              Enfoca el código de barras dentro del visor para una detección instantánea de alta
              precisión.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/40 text-rose-400 px-8 py-4 rounded-3xl text-sm font-bold text-center animate-in slide-in-from-bottom-4">
            {error}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes scan-line {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(160px);
          }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
        #reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  )
}
