// utils/api.ts throws at import time without a base URL; tests never hit the network
// (fetch is mocked per test), so any value works.
process.env.EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.test";

// In-memory stand-in for the native keychain/keystore.
jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);

// Screens log handled errors on purpose; keep that noise out of test output.
jest.mock("./src/utils/logError");
