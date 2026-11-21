/// Configuración de entorno de la app.
///
/// El backend Renault corre en Next.js. En desarrollo local:
/// - Web/desktop (mismo host): http://localhost:5000
/// - Emulador Android: http://10.0.2.2:5000
/// - Dispositivo físico: http://`<ip-de-tu-pc>`:5000
///
/// Sobrescribí con: flutter run --dart-define=API_BASE_URL=http://...
class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5000',
  );

  static String get apiBase => '$apiBaseUrl/api';
}
