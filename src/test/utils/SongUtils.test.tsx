import { makeThreeDigits } from "../../utils/SongUtils";

describe("Song Utils Tests", () => {
  it("Make 3 Digits Test", () => {
    expect(makeThreeDigits(4)).toBe("004");
    expect(makeThreeDigits(23)).toBe("023");
    expect(makeThreeDigits(487)).toBe("487");
  });
});
