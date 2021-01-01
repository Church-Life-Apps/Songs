import { decrypt, encrypt } from "../../utils/SecurityUtils";

describe("Security Utils Tests", () => {
  it("Encrypt and Decrypt Test", () => {
    const text = "hello world";
    const privateKey = "key1";

    const encrypted = encrypt(text, privateKey);
    expect(encrypted).not.toBe(text);
    const decrypted = decrypt(encrypted, privateKey);
    expect(decrypted).toBe(text);

    expect(decrypt(encrypted, "key2")).not.toBe(text);
  });
});
