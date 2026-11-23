import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { SileoProvider } from "@/components/providers/sileo-provider"
import { SettingsLoader } from "@/components/settings-loader"

export const metadata: Metadata = {
  title: "Renault - Sistema de Gestión",
  description: "Sistema de gestión de repuestos automotrices Renault",
  icons: {
    icon: "/api/settings/logo",
    apple: "/api/settings/logo",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Renault ERP",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/api/settings/logo" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
          <SileoProvider />
          <SettingsLoader />
        </ThemeProvider>
      </body>
    </html>
  )
}
