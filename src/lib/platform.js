/**
 * Platform detection utilities
 *
 * Detects whether the app is running inside a Capacitor native shell (iOS/Android)
 * vs the regular web browser. Used to hide payment UI on iOS (App Store compliance)
 * and handle APIs unavailable in WKWebView.
 */

export function isNativeApp() {
  try {
    return !!(window.Capacitor?.isNativePlatform?.() ?? window.Capacitor?.isNative)
  } catch {
    return false
  }
}

export function isIOSNativeApp() {
  try {
    return isNativeApp() && window.Capacitor?.getPlatform?.() === 'ios'
  } catch {
    return false
  }
}

/**
 * Check if Speech Recognition API is available and functional.
 * WKWebView on iOS often lacks this API.
 */
export function isSpeechRecognitionAvailable() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

/**
 * Check if getUserMedia (microphone) is available.
 * May be unavailable in WKWebView without Capacitor plugins.
 */
export function isMicrophoneAvailable() {
  return !!(navigator.mediaDevices?.getUserMedia)
}
