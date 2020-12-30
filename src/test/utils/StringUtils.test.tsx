import { getSimilarity, removePunctuation } from "../../utils/StringUtils";

describe("String Utils Tests", () => {
    it("Remove punctuation test", () => {
        expect(removePunctuation("string's with#%@ specia!@l characters[]-=...")).toBe("strings with special characters");
    });

    it("Get String Similarity Test", () => {
        const match1 = getSimilarity("string one", "kind of close to one string");
        const match2 = getSimilarity("string two", "string two yeah");
        expect(match1).toBeGreaterThan(0);
        expect(match2).toBeGreaterThan(0);
        expect(match2).toBeGreaterThan(match1);
    });    
});
