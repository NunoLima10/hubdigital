import { expect, it, vi } from "vitest";

const { close, teardownDB } = vi.hoisted(() => ({
  close: vi.fn(),
  teardownDB: vi.fn(),
}));
vi.mock("../../src/server", () => ({
  buildServer: async () => ({
    listen: async () => { throw new Error("Port unavailable"); },
    close,
  }),
}));
vi.mock("../../src/db", () => ({ setupDB: async () => ({ db: {}, dbClient: {} }), teardownDB }));
vi.mock("../../src/lib/analytics", () => ({ analytics: { shutdown: vi.fn() } }));
vi.mock("../../src/modules/project-badges/project-badges-services", () => ({ startProjectBadgeJobs: vi.fn() }));
vi.mock("../../src/utils/logger", () => ({ logger: { error: vi.fn() } }));

it("closes resources and signals failure when the API cannot listen", async () => {
  const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
  try {
    await import("../../src/main.js");
    await vi.waitFor(() => expect(exit).toHaveBeenCalledExactlyOnceWith(1));
    expect(close).toHaveBeenCalledOnce();
    expect(teardownDB).toHaveBeenCalledOnce();
  } finally {
    exit.mockRestore();
  }
});
