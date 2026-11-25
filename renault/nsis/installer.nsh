; ============================================================================
;  Renault ERP - Script NSIS personalizado
; ----------------------------------------------------------------------------
;  Escribe un identificador único de instalación en la carpeta de instalación.
;  La app lo guarda como diagnóstico y como señal de actualización. NO reinicia
;  la base local: el instalador corre en cada actualización y eso borraría los
;  datos de la empresa. La base sólo se crea limpia en la primera ejecución;
;  las actualizaciones conservan datos y credenciales.
; ============================================================================

!macro customInstall
  ; Id único por instalación: sello de compilación + contador de arranque.
  ; `GetTime` no está disponible en el NSIS empaquetado con electron-builder,
  ; así que se usa System::Call (siempre disponible) para obtener un valor que
  ; cambia en cada ejecución del instalador.
  System::Call "kernel32::GetTickCount() i .r0"

  ; El id se escribe en la carpeta de instalación ($INSTDIR)
  ClearErrors
  FileOpen $1 "$INSTDIR\renault-install-id.txt" w
  IfErrors +2 0
  FileWrite $1 "${__DATE__}-${__TIME__}-$0"
  FileClose $1
!macroend
