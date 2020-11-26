import { decrypt, encrypt } from "../../utils/SecurityUtils";

describe("Security Utils Tests", () => {
  it("Encrypt and Decrypt Test", () => {
    let text = JSON.stringify({data: "hello world"});
    let privateKey = "key1";

    let encrypted = encrypt(text, privateKey);
    expect(encrypted).not.toBe(text);
    let decrypted = decrypt(encrypted, privateKey);
    expect(decrypted).toBe(text);

    expect(decrypt(encrypted, "key2")).not.toBe(text);
  });
});
