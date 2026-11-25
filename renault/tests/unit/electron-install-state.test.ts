import { describe, expect, it } from "vitest"
import { createRequire } from "node:module"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const require = createRequire(import.meta.url)
const {
  readInstallState,
  writeInstallState,
  readInstallerInstallId,
  resolveInstallAction,
} = require("../../lib/electron/install-state.js")

describe("Estado de instalación (Electron)", () => {
  it("no reinicia la base de datos en desarrollo", () => {
    const action = resolveInstallAction({
      isDev: true,
      currentVersion: "0.9.0",
      installerInstallId: "install-1",
      previousState: { version: "0.8.0", installId: "install-0" },
    })

    expect(action).toEqual({ reset: false, reason: "dev" })
  })

  it("reinicia la base en la primera instalación", () => {
    const action = resolveInstallAction({
      isDev: false,
      currentVersion: "0.9.0",
      installerInstallId: null,
      previousState: null,
    })

    expect(action).toEqual({ reset: true, reason: "first-install" })
  })

  it("conserva la base y las credenciales cuando el instalador escribe un id nuevo (actualización)", () => {
    // El instalador NSIS reescribe el id en cada actualización, pero no debe
    // alterar las credenciales guardadas.
    const action = resolveInstallAction({
      isDev: false,
      currentVersion: "0.9.0",
      installerInstallId: "install-2",
      previousState: { version: "0.9.0", installId: "install-1" },
    })

    expect(action).toEqual({ reset: false, reason: "updated" })
  })

  it("conserva la base y las credenciales cuando cambia la versión de la app", () => {
    const action = resolveInstallAction({
      isDev: false,
      currentVersion: "0.10.0",
      installerInstallId: "install-1",
      previousState: { version: "0.9.0", installId: "install-1" },
    })

    expect(action).toEqual({ reset: false, reason: "updated" })
  })

  it("conserva datos y contraseña cuando la instalación no cambió", () => {
    const action = resolveInstallAction({
      isDev: false,
      currentVersion: "0.9.0",
      installerInstallId: "install-1",
      previousState: { version: "0.9.0", installId: "install-1" },
    })

    expect(action).toEqual({ reset: false, reason: "existing-install" })
  })

  it("guarda y lee el estado de instalación", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "renault-install-state-"))
    const statePath = path.join(dir, ".desktop-install-state.json")

    try {
      expect(readInstallState(statePath)).toBeNull()

      writeInstallState(statePath, { version: "0.9.0", installId: "install-1" })

      expect(readInstallState(statePath)).toEqual({ version: "0.9.0", installId: "install-1" })
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it("lee el id de instalación escrito por el instalador", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "renault-install-id-"))

    try {
      expect(readInstallerInstallId(dir)).toBeNull()

      fs.writeFileSync(path.join(dir, "renault-install-id.txt"), "20261110193000")
      expect(readInstallerInstallId(dir)).toBe("20261110193000")
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
