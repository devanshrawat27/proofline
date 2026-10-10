import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const service = new PasswordService();

  it("hashes passwords and never returns the plaintext", async () => {
    const plain = "correct horse battery staple";
    const hash = await service.hash(plain);
    expect(hash).not.toEqual(plain);
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifies the correct password and rejects a wrong one", async () => {
    const hash = await service.hash("correct horse battery staple");
    await expect(service.verify("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(service.verify("wrong password", hash)).resolves.toBe(false);
  });

  it("returns false for a malformed hash instead of throwing", async () => {
    await expect(service.verify("anything", "not-a-real-hash")).resolves.toBe(false);
  });

  it("rejects passwords that are too short", () => {
    expect(() => service.assertStrongEnough("short")).toThrow();
    expect(() => service.assertStrongEnough("long-enough-password")).not.toThrow();
  });
});
