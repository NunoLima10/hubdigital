import { beforeEach, describe, expect, it, vi } from "vitest";
const { signUp, config } = vi.hoisted(() => ({
  signUp: vi.fn(),
  config: { ADMIN_SEED_EMAIL: "admin@example.test", ADMIN_SEED_PASSWORD: "operator-secret", ADMIN_SEED_NAME: "Admin" },
}));
vi.mock("../../src/config", () => ({ config }));
vi.mock("../../src/lib/auth", () => ({ auth: { api: { signUpEmail: signUp } } }));
vi.mock("../../src/utils/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
import seed from "../../src/db/seeds/users/admin";

describe("admin bootstrap", () => {
  beforeEach(() => vi.clearAllMocks());
  function database(existing: { id: string; role: string } | null) {
    const where = vi.fn().mockReturnValue({ returning: async () => [{ id: "new-admin" }] });
    const set = vi.fn().mockReturnValue({ where });
    const db = { query: { users: { findFirst: vi.fn().mockResolvedValue(existing) } }, update: vi.fn().mockReturnValue({ set }) };
    return { db, set, where };
  }
  it("refuses to promote an account registered before bootstrap", async () => {
    const { db } = database({ id: "attacker", role: "user" });
    await expect(seed(db as any)).rejects.toThrow("non-admin account");
    expect(db.update).not.toHaveBeenCalled();
    expect(signUp).not.toHaveBeenCalled();
  });
  it("leaves existing admins and their credentials unchanged", async () => {
    const { db } = database({ id: "admin", role: "admin" });
    await seed(db as any);
    expect(db.update).not.toHaveBeenCalled();
    expect(signUp).not.toHaveBeenCalled();
  });
  it("promotes only the identity returned by successful registration", async () => {
    const { db, set, where } = database(null);
    signUp.mockResolvedValue({ user: { id: "new-admin" } });
    await seed(db as any);
    expect(signUp).toHaveBeenCalledWith({ body: { email: config.ADMIN_SEED_EMAIL, password: config.ADMIN_SEED_PASSWORD, name: config.ADMIN_SEED_NAME } });
    expect(set).toHaveBeenCalledWith({ role: "admin", emailVerified: true });
    expect(where).toHaveBeenCalledOnce();
  });
  it("does not promote anyone if a racing registration makes sign-up fail", async () => {
    const { db } = database(null);
    signUp.mockRejectedValue(new Error("Email exists"));
    await expect(seed(db as any)).rejects.toThrow("Email exists");
    expect(db.update).not.toHaveBeenCalled();
  });
});
