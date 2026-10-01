// Not console error because it opens the LogBox
export function logError(context: string, error: unknown) {
  if (__DEV__) console.log(`${context}:`, error);
}

//----------------------------------- END OF FILE ---------------------------------//
