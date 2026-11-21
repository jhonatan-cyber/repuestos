"use client"

import { Toaster } from "sileo"

export function SileoProvider() {
  return (
    <Toaster
      position="top-center"
      options={{
        fill: "black",
        styles: {
          title: "text-white",
          description: "text-white/90",
        },
      }}
    />
  )
}
