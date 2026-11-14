# Hub Digital Web

## Maps

The default raster layer uses OpenStreetMap for modest interactive browser traffic.
Keep attribution visible and preserve normal browser caching and the Referer header.
Do not add tile prefetching or offline downloads. For a higher-traffic deployment,
set `VITE_APP_MAP_TILE_URL` and `VITE_APP_MAP_TILE_ATTRIBUTION` in the web environment.
See the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

CARTO raster tiles require an API key. To use CARTO, include your key in the configured
tile URL and credit both CARTO and OpenStreetMap in the attribution.

## Backlog verification

Run `pnpm --filter @hubdigital/web test` for component and submission tests.

With the API on port 3001, the web app on port 5173, a catalogue containing
published projects with public locations, and Playwright installed:

```powershell
node web/tests/browser/backlog.smoke.cjs
```

`PLAYWRIGHT_MODULE` can point to an existing `@playwright/test` installation.
`BACKLOG_WEB_URL` overrides the web origin. Screenshots are saved under
`web/node_modules/.tmp/backlog-qa` by default; `BACKLOG_ARTIFACTS` overrides that path.
The browser checks mobile map layouts, map state restoration, shareable discovery
filters, duplicate-link feedback, project requests, and collaborator management.
Submission writes are mocked, leaving the local catalogue untouched.

