"use client"

import { BrandLogo } from "@/components/brand/brand-logo"

export function LoginHero() {
  return (
    <div className="relative hidden w-full lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-8 overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-700 z-10">
      {/* Efectos decorativos */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradiente suave Púrpura */}
        <div className="absolute top-[-30%] left-[-20%] w-[700px] h-[700px] bg-primary/20 dark:bg-primary/10 blur-[150px] rounded-full" />

        {/* Gradiente suave Ámbar */}
        <div className="absolute bottom-[-30%] right-[-20%] w-[600px] h-[600px] bg-amber-400/20 dark:bg-amber-400/10 blur-[120px] rounded-full" />

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

      {/* Logo Banner Full Width - MAS GRANDE */}
      <div className="relative z-10 w-full flex-1 flex items-center justify-center animate-in fade-in slide-in-from-top-12 duration-[1.5s] ease-out">
        <div className="relative w-full h-full min-h-[300px] flex items-center justify-center px-4">
          <BrandLogo
            className="h-[clamp(220px,34vw,440px)] w-full max-w-[760px]"
            alt="Renault Logo"
          />
        </div>
      </div>

      {/* Footer info */}
      <div className="relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-[1.5s] delay-500 fill-mode-both ease-out"></div>
    </div>
  )
}
