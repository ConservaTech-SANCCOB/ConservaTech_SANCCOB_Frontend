import "@testing-library/jest-dom";

//--------------------ENVIRONMENT--------------------//

process.env.NEXT_PUBLIC_API_URL = "https://api.test";

//--------------------GUARDS--------------------//

// Unmocked fetch fails the test instead of reaching the API
const unmockedFetch = () => {
  throw new Error("unmocked fetch");
};

beforeEach(() => {
  global.fetch = jest.fn(unmockedFetch) as unknown as typeof fetch;
  window.alert = jest.fn();
  jest.spyOn(console, "error").mockImplementation(() => {});
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

//----------------------------------- END OF FILE ---------------------------------//
