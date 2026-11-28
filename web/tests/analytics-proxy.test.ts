// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import worker from "../src/server";

vi.mock("@tanstack/react-start/server-entry", () => ({ default: { fetch: vi.fn() } }));
afterEach(() => vi.unstubAllGlobals());

it.each([
  ["/ingest/e/?v=1", "https://eu.i.posthog.com/e/?v=1"],
  ["/ingest/static/app.js", "https://eu-assets.i.posthog.com/static/app.js"],
  ["/ingest//example.test", "https://eu.i.posthog.com//example.test"],
])("forwards %s only to the configured analytics origin", async (path, expected) => {
  const upstream = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", upstream);
  const request = new Request("https://site.test" + path, {
    headers: { cookie: "test=value", authorization: "test", host: "site.test" },
  });
  expect((await worker.fetch(request, {})).status).toBe(204);
  const [destination, options] = upstream.mock.calls[0];
  expect(String(destination)).toBe(expected);
  expect(options?.redirect).toBe("manual");
  const headers = new Headers(options?.headers);
  for (const header of ["cookie", "authorization", "host"]) expect(headers.has(header)).toBe(false);
});

it("rejects upstream redirects", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.redirect("https://example.test")));
  const response = await worker.fetch(new Request("https://site.test/ingest/e/"), {});
  expect(response.status).toBe(502);
  expect(response.headers.has("location")).toBe(false);
});
