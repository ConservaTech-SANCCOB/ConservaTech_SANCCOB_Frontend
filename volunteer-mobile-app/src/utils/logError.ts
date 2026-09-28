/**
 * Logs an error that the screen has already handled (toast, alert or error state).
 * Deliberately not console.error: in dev builds that pops Expo's red LogBox banner
 * over the bottom of the screen, covering the real message shown to the user.
 * console.log still prints to the Metro terminal for debugging.
 */
export function logError(context: string, error: unknown) {
  if (__DEV__) console.log(`${context}:`, error);
}
