import nextJest from "next/jest.js";

//--------------------CONFIG--------------------//

// Run every test in South African time
process.env.TZ = "Africa/Johannesburg";

const createJestConfig = nextJest({ dir: "./" });

export default createJestConfig({
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/__tests__/**/*.test.{ts,tsx}"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
});

//----------------------------------- END OF FILE ---------------------------------//
