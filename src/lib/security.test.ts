import { describe, expect, it } from "vitest";
import { createOpaqueToken, hashPassword, hashToken, isStrongPassword, verifyPassword } from "./security";

describe("security utilities", () => {
  it("creates non-repeating opaque invitation tokens and deterministic hashes", () => {
    const first = createOpaqueToken(); const second = createOpaqueToken();
    expect(first).not.toBe(second); expect(first.length).toBeGreaterThanOrEqual(40);
    expect(hashToken(first)).toBe(hashToken(first)); expect(hashToken(first)).not.toBe(first);
  });
  it("enforces the password policy", () => {
    expect(isStrongPassword("short")).toBe(false);
    expect(isStrongPassword("TwelveChars1!")).toBe(true);
  });
  it("hashes and verifies passwords without retaining plaintext", async () => {
    const hash = await hashPassword("TwelveChars1!");
    expect(hash).not.toContain("TwelveChars1!");
    expect(await verifyPassword("TwelveChars1!", hash)).toBe(true);
    expect(await verifyPassword("WrongPassword1!", hash)).toBe(false);
  });
});
