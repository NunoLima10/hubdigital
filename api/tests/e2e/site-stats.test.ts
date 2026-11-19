import { setupDB, teardownDB } from "@/db";
import { siteStatsSnapshots } from "@/db/schemas";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import "../setup-env";
import { SiteStatsService } from "../../src/modules/site-stats/site-stats-services";
import { migrationsFolder } from "./helpers/admin-harness";

const { runHogQL, state } = vi.hoisted(() => ({
  runHogQL: vi.fn(),
  state: { enabled: true },
}));

vi.mock("../../src/lib/posthog-query", () => ({
  get posthogQueryEnabled() {
    return state.enabled;
  },
  runHogQL: (...args: unknown[]) => runHogQL(...args),
}));

const row = (visitors: number) => ({
  year: 2026,
  year_visitors: visitors,
  year_pageviews: visitors * 4,
  year_home_views: visitors * 2,
  all_visitors: visitors,
  all_pageviews: visitors * 4,
  all_home_views: visitors * 2,
  since: "2026-05-02T10:00:00Z",
});

const MINUTES = 60_000;

describe("Site stats snapshots (e2e)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let connectionUri: string;
  let dbClient: Awaited<ReturnType<typeof setupDB>>["dbClient"];
  let db: Awaited<ReturnType<typeof setupDB>>["db"];

  /** Pretends the latest refresh happened `minutes` ago. */
  async function ageSnapshots(minutes: number) {
    await db
      .update(siteStatsSnapshots)
      .set({ fetchedAt: new Date(Date.now() - minutes * MINUTES) });
  }

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17").start();
    connectionUri = container.getConnectionUri();
    process.env.DATABASE_URL = connectionUri;

    const setupResult = await setupDB(connectionUri, { migrating: true });
    await migrate(setupResult.db, { migrationsFolder });
    await teardownDB(setupResult.dbClient);
  });

  beforeEach(async () => {
    state.enabled = true;
    runHogQL.mockReset();
    const setupResult = await setupDB(connectionUri);
    db = setupResult.db;
    dbClient = setupResult.dbClient;
    await db.delete(siteStatsSnapshots);
    await SiteStatsService.settle();
  });

  afterEach(async () => {
    await SiteStatsService.settle();
    if (dbClient) await teardownDB(dbClient);
  });

  afterAll(async () => {
    if (container) await container.stop();
  });

  it("returns null without querying when PostHog is not configured", async () => {
    state.enabled = false;
    expect(await SiteStatsService.get(db)).toBeNull();
    expect(runHogQL).not.toHaveBeenCalled();
  });

  it("waits for PostHog on the first run and stores the snapshot", async () => {
    runHogQL.mockResolvedValueOnce([row(5)]);

    const stats = await SiteStatsService.get(db);

    expect(stats).toMatchObject({
      year: 2026,
      yearToDate: { visitors: 5, pageviews: 20, homeViews: 10 },
      allTime: { visitors: 5, since: "2026-05-02T10:00:00.000Z" },
    });
    expect(runHogQL.mock.calls[0][2]).toEqual({ environment: "production" });

    const [stored] = await db.select().from(siteStatsSnapshots);
    expect(stored.payload).toEqual(stats);
    expect(stored.refreshingAt).toBeNull();
  });

  it("serves a fresh snapshot without asking PostHog", async () => {
    runHogQL.mockResolvedValueOnce([row(5)]);
    await SiteStatsService.get(db);
    await SiteStatsService.settle();
    await ageSnapshots(4);

    expect((await SiteStatsService.get(db))?.yearToDate.visitors).toBe(5);
    expect(runHogQL).toHaveBeenCalledTimes(1);
  });

  it("serves a stale snapshot at once and refreshes it in the background", async () => {
    runHogQL.mockResolvedValueOnce([row(5)]);
    await SiteStatsService.get(db);
    await SiteStatsService.settle();
    await ageSnapshots(6);

    runHogQL.mockResolvedValueOnce([row(8)]);
    expect((await SiteStatsService.get(db))?.yearToDate.visitors).toBe(5);

    await SiteStatsService.settle();
    expect((await SiteStatsService.get(db))?.yearToDate.visitors).toBe(8);
    expect(runHogQL).toHaveBeenCalledTimes(2);
  });

  it("lets only one of many concurrent requests refresh", async () => {
    runHogQL.mockResolvedValueOnce([row(5)]);
    await SiteStatsService.get(db);
    await SiteStatsService.settle();
    await ageSnapshots(6);

    runHogQL.mockResolvedValue([row(8)]);
    await Promise.all(Array.from({ length: 5 }, () => SiteStatsService.get(db)));
    await SiteStatsService.settle();

    expect(runHogQL).toHaveBeenCalledTimes(2);
  });

  it("keeps the last snapshot and spaces retries when PostHog fails", async () => {
    runHogQL.mockResolvedValueOnce([row(5)]);
    await SiteStatsService.get(db);
    await SiteStatsService.settle();
    await ageSnapshots(6);

    runHogQL.mockRejectedValue(new Error("429"));
    expect((await SiteStatsService.get(db))?.yearToDate.visitors).toBe(5);
    await SiteStatsService.settle();

    // The failed claim still stands, so the next visitor does not retry.
    expect((await SiteStatsService.get(db))?.yearToDate.visitors).toBe(5);
    await SiteStatsService.settle();
    expect(runHogQL).toHaveBeenCalledTimes(2);
  });

  it("returns null when the first run fails", async () => {
    runHogQL.mockRejectedValueOnce(new Error("timeout"));
    expect(await SiteStatsService.get(db)).toBeNull();
  });
});
