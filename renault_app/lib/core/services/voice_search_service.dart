import 'package:speech_to_text/speech_to_text.dart' as stt;

/// Singleton service for speech-to-text voice search.
/// Uses the speech_to_text package for native speech recognition.
class VoiceSearchService {
  VoiceSearchService._();
  static final VoiceSearchService instance = VoiceSearchService._();

  final _speech = stt.SpeechToText();
  bool _isListening = false;
  bool _initialized = false;

  /// Initialize speech recognition and request permissions.
  Future<bool> initialize() async {
    if (_initialized) return _speech.hasPermission;
    final granted = await _speech.initialize(
      onStatus: (status) {
        _isListening = status == 'listening';
      },
      onError: (error) {
        _isListening = false;
      },
    );
    _initialized = granted;
    return granted;
  }

  bool get isListening => _isListening;

  /// Start listening for voice input.
  /// [onResult] is called with the recognized text.
  /// [onError] is called if an error occurs.
  /// Returns true if listening started successfully.
  Future<bool> startListening({
    required Function(String) onResult,
    Function(String)? onError,
    String? localeId,
  }) async {
    if (_isListening) {
      await stopListening();
    }

    final hasPermission = await _speech.hasPermission;
    if (!hasPermission) {
      onError?.call('Sin permiso de micrófono');
      return false;
    }

    _isListening = true;
    _speech.listen(
      onResult: (result) {
        onResult(result.recognizedWords);
      },
      listenOptions: stt.SpeechListenOptions(
        localeId: localeId,
        partialResults: true,
      ),
    );
    return _isListening;
  }

  /// Stop listening.
  Future<void> stopListening() async {
    _isListening = false;
    await _speech.stop();
  }
}
