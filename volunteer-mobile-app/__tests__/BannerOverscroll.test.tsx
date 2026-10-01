import { render } from "@testing-library/react-native";
import { Platform, StyleSheet } from "react-native";
import { AboveBannerFill, BelowContentFill, refreshableBannerScrollStyles } from "../src/components/BannerOverscroll";
import { COLORS } from "../src/utils/colors";

afterEach(() => {
  jest.restoreAllMocks();
});

it("fills the space above the banner with the banner's top colour", async () => {
  const { toJSON } = await render(<AboveBannerFill color={COLORS.pinkLight} />);
  const style = StyleSheet.flatten((toJSON() as { props: Record<string, unknown> }).props.style as object);

  expect(style).toMatchObject({ position: "absolute", bottom: "100%", backgroundColor: COLORS.pinkLight });
});

it("keeps the space below the content white", async () => {
  const { toJSON } = await render(<BelowContentFill />);
  const style = StyleSheet.flatten((toJSON() as { props: Record<string, unknown> }).props.style as object);

  expect(style).toMatchObject({ position: "absolute", top: "100%", backgroundColor: COLORS.white });
});

it("on iOS shows the banner colour behind a refreshable list and keeps its content white", () => {
  jest.replaceProperty(Platform, "OS", "ios");

  expect(refreshableBannerScrollStyles(COLORS.blueLight)).toEqual({
    scroll: { backgroundColor: COLORS.blueLight },
    content: { backgroundColor: COLORS.white },
  });
});

it("leaves Android unchanged, since it doesn't bounce past the top", () => {
  jest.replaceProperty(Platform, "OS", "android");

  expect(refreshableBannerScrollStyles(COLORS.blueLight)).toEqual({});
});
