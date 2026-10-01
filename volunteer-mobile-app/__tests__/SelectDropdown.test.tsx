import { fireEvent, render, screen } from "@testing-library/react-native";
import SelectDropdown from "../src/components/SelectDropdown";
import { AGE_BRACKETS } from "../src/constants/ageBrackets";

function renderDropdown(value: string, onChange = jest.fn()) {
  return render(
    <SelectDropdown
      value={value}
      options={AGE_BRACKETS}
      onChange={onChange}
      placeholder="Select your age bracket"
      icon="hourglass-outline"
      accessibilityLabel="Age bracket"
    />
  );
}

describe("SelectDropdown", () => {
  it("shows the placeholder when nothing is selected", async () => {
    await renderDropdown("");
    expect(screen.getByText("Select your age bracket")).toBeOnTheScreen();
  });

  it("shows the current value", async () => {
    await renderDropdown("35-44");
    expect(screen.getByText("35-44")).toBeOnTheScreen();
  });

  it("lists exactly the given options once opened", async () => {
    await renderDropdown("");
    expect(screen.queryByText("65+")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Age bracket" }));

    for (const option of AGE_BRACKETS) {
      expect(screen.getByText(option)).toBeOnTheScreen();
    }
  });

  it("reports the picked option and closes", async () => {
    const onChange = jest.fn();
    await renderDropdown("", onChange);

    await fireEvent.press(screen.getByRole("button", { name: "Age bracket" }));
    await fireEvent.press(screen.getByText("55-64"));

    expect(onChange).toHaveBeenCalledWith("55-64");
    expect(screen.queryByText("65+")).toBeNull();
  });
});
