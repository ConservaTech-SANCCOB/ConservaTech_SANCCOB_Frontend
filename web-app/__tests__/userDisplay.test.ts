import { getDisplayName, getFirstName, getInitials, getRoleLabel } from "../app/lib/user-display";

//--------------------TESTS--------------------//

describe("user display helpers", () => {
  it("initials, display name, first name and role label fall back sensibly", () => {
    const named = { name: "Cathy van der Merwe", email: "cathy@sanccob.co.za" };
    const emailOnly = { name: null, email: "lee@sanccob.co.za" };

    expect(getInitials(named)).toBe("CM");
    expect(getInitials(emailOnly)).toBe("L");
    expect(getInitials(null)).toBe("?");

    expect(getDisplayName(named)).toBe("Cathy van der Merwe");
    expect(getDisplayName(emailOnly)).toBe("lee@sanccob.co.za");
    expect(getDisplayName(null)).toBe("Admin");

    expect(getFirstName(named)).toBe("Cathy");
    expect(getFirstName(emailOnly)).toBe("lee");
    expect(getFirstName(null)).toBe("there");

    expect(getRoleLabel("admin")).toBe("Administrator");
    expect(getRoleLabel("Trainer")).toBe("Trainer");
    expect(getRoleLabel(null)).toBe("");
  });
});

//----------------------------------- END OF FILE ---------------------------------//
