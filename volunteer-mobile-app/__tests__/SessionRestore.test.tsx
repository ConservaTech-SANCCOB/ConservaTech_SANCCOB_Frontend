import { renderRouter, screen } from "expo-router/testing-library";
import { Text } from "react-native";
import RootLayout from "../src/app/_layout";
import { clearToken, getSessionRole, getToken, saveToken } from "../src/utils/api";

//--------------------HELPERS--------------------//

const stub = (label: string) => () => <Text>{label}</Text>;
const routes = {
  _layout: RootLayout,
  index: stub("Welcome"),
  login: stub("Login"),
  "(tabs)/home": stub("Home"),
};

// ------------------------------------------------------------ //

beforeEach(async () => {
  jest.clearAllMocks();
  await clearToken();
});

//--------------------TESTS--------------------//

it("doesn't restore a trainer session on relaunch and shows Welcome", async () => {
  await saveToken("trainer-token", "trainer");

  await renderRouter(routes, { initialUrl: "/" });

  expect(await screen.findByText("Welcome")).toBeOnTheScreen();
  expect(await getToken()).toBeNull();
  expect(await getSessionRole()).toBe("volunteer");
  expect(screen.queryByText("Home")).toBeNull();
});

//----------------------------------- END OF FILE ---------------------------------//
