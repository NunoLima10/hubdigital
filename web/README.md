# Hub Digital Web

## Maps

The default raster layer uses OpenStreetMap for modest interactive browser traffic.
Keep attribution visible and preserve normal browser caching and the Referer header.
Do not add tile prefetching or offline downloads. For a higher-traffic deployment,
set `VITE_APP_MAP_TILE_URL` and `VITE_APP_MAP_TILE_ATTRIBUTION` in the web environment.
See the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

CARTO raster tiles require an API key. To use CARTO, include your key in the configured
tile URL and credit both CARTO and OpenStreetMap in the attribution.

