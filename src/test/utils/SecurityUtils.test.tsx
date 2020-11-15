import { decrypt, encrypt } from "../../utils/SecurityUtils";

describe("Security Utils Tests", () => {
  it("Encrypt and Decrypt Test", () => {
    let text = "hello world";
    let privateKey = "private key";

    let encrypted = encrypt(text, privateKey);
    expect(encrypted).not.toBe(text);
    let decrypted = decrypt(encrypted, privateKey);
    expect(decrypted).toBe(text);

    expect(decrypt(encrypted, "other private key")).not.toBe(text);
  });
});
