const fs = require("fs")
const path = require("path")

/**
 * Estado de instalación de la app de escritorio.
 *
 * La base de datos local (SQLite en userData) se crea limpia sólo la PRIMERA
 * vez que la app arranca en un perfil (cuando no hay estado previo). Las
 * actualizaciones y reinstalaciones conservan los datos.
 *
 * El instalador NSIS escribe un "id de instalación" nuevo en cada actualización,
 * por eso ese id ya NO se usa como señal de instalación nueva (antes borraba la
 * base de la empresa en cada versión). Se sigue guardando como diagnóstico.
 */

const INSTALL_STATE_FILE = ".desktop-install-state.json"
const INSTALLER_ID_FILE = "renault-install-id.txt"

/** Ruta del archivo con el id de instalación que escribe el instalador NSIS. */
function getInstallerInstallIdPath(installDir = path.dirname(process.execPath)) {
  return path.join(installDir, INSTALLER_ID_FILE)
}

/** Lee el id de instalación; null si el archivo no existe o está vacío. */
function readInstallerInstallId(installDir = path.dirname(process.execPath)) {
  try {
    const filePath = getInstallerInstallIdPath(installDir)
    if (!fs.existsSync(filePath)) return null
    const value = fs.readFileSync(filePath, "utf8").trim()
    return value.length > 0 ? value : null
  } catch {
    return null
  }
}

/** Lee el estado de instalación guardado en userData; null si no existe. */
function readInstallState(statePath) {
  try {
    if (!fs.existsSync(statePath)) return null
    const parsed = JSON.parse(fs.readFileSync(statePath, "utf8"))
    return parsed && typeof parsed === "object" ? parsed : null
  } catch {
    return null
  }
}

/** Persiste el estado de instalación. Devuelve true si se pudo escribir. */
function writeInstallState(statePath, state) {
  try {
    const parentDir = path.dirname(statePath)
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true })
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2))
    return true
  } catch {
    return false
  }
}

/**
 * Decide qué hacer con la base local al arrancar.
 *
 * - `reset`: reinicia la base (sólo primera ejecución del perfil, no hay datos
 *   que perder). Las actualizaciones conservan los datos.
 * - `resetAdminPassword`: garantiza el usuario admin@gmail.com con la contraseña
 *   por defecto. Se aplica en la primera instalación y en cada actualización o
 *   reinstalación (si el admin cambió su contraseña, vuelve a admin123).
 *
 * Para detectar una actualización se usan dos señales: el id que reescribe el
 * instalador NSIS en cada instalación y el cambio de versión de la app
 * (electron-updater). Ninguna reinicia la base.
 *
 * @param {object} params
 * @param {boolean} params.isDev            En desarrollo no se toca nada.
 * @param {string|null} params.currentVersion Versión actual de la app.
 * @param {string|null} params.installerInstallId Id escrito por el instalador.
 * @param {object|null} params.previousState  Estado leído de userData.
 * @returns {{reset: boolean, resetAdminPassword: boolean, reason: string}}
 */
function resolveInstallAction({
  isDev = false,
  currentVersion = null,
  installerInstallId = null,
  previousState = null,
} = {}) {
  if (isDev) {
    return { reset: false, resetAdminPassword: false, reason: "dev" }
  }

  // Nunca se corrió la app en este perfil: instalación limpia.
  if (!previousState || !previousState.version) {
    return { reset: true, resetAdminPassword: true, reason: "first-install" }
  }

  // El instalador reescribió su id o cambió la versión → actualización.
  const installerChanged =
    Boolean(installerInstallId) && previousState.installId !== installerInstallId
  const versionChanged = Boolean(currentVersion) && previousState.version !== currentVersion

  if (installerChanged || versionChanged) {
    return { reset: false, resetAdminPassword: true, reason: "updated" }
  }

  // Misma instalación: se conservan datos y credenciales.
  return { reset: false, resetAdminPassword: false, reason: "existing-install" }
}

module.exports = {
  INSTALL_STATE_FILE,
  INSTALLER_ID_FILE,
  getInstallerInstallIdPath,
  readInstallerInstallId,
  readInstallState,
  writeInstallState,
  resolveInstallAction,
}
