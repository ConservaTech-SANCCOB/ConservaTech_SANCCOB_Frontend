export function logError(context: string, error: unknown) {
  if (__DEV__) console.log(`${context}:`, error);
}
