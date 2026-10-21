# Cabo Verde and diaspora geography

Milestone 4 implementation, October 2026. Uses the existing design tokens; three optional disclosure sections keep geography separate from project categories and business fields.

## Submission and storage

- **Onde está a equipa?**: an optional primary base and up to four additional public bases, with local/distributed team mode. All 249 ISO countries and territories are searchable. Cabo Verde may be disclosed at country level; island, municipality and locality are optional and their hierarchy is validated. Location is independent of the maker’s residence.
- **Onde pode ser usado?**: unanswered, worldwide, or selected countries. A draft can retain an unfinished selected-country answer; publication requires at least one country for that choice.
- **Ligação a Cabo Verde**: optional independent answers for a local team, diaspora team, serving Cabo Verde, serving diaspora, or another connection. These answers are not inferred from addresses and do not restrict publication.
- Public pins are opt-in. Latitude and longitude must be paired, finite and in range; zero is valid. Approximate pins are rounded to 0.1 degrees before persistence, including drafts and additional bases. Exact pins retain their coordinates only when the builder deliberately chooses **Local público exato**. The form says the location is public and provides keyboard-accessible coordinate inputs alongside map clicking/dragging.
- Migration `0023_worldwide_geography` changes the primary country column to a two-character code, adds JSON location details/additional bases/service area/local connection, and removes the limited country enum. Existing “other” country answers become undisclosed; no country is guessed.

## Display and map

Preview and public detail reuse `ProjectGeography`; moderation receives the same fields. Empty optional information is omitted.

The map has Cabo Verde and Mundo / Diáspora modes, country/island/category filters, accessible results and counts for projects without a public location. `/v1/projects/map` returns small, stable ID-ordered pages of up to 200 public records, independently of ranking. The client loads every matching page and cancels stale requests. Secondary bases match geographical filters. Hidden projects, hidden owners, deleted projects and drafts are excluded.

Country/island-only records use labelled regional aggregates. Approximate pins are grouped at their rounded position; exact public pins use their selected point. ID-derived illustrative offsets were removed. Unlocated projects remain in the results list. Maps use Leaflet/OpenStreetMap with required attribution and the app’s own colors.

Country reference: [mledoze/countries](https://github.com/mledoze/countries), adapted to ISO codes, Portuguese names and regional centres under ODbL-1.0; license retained in `packages/shared/COUNTRY-DATA-LICENSE.txt`. These centres are not headquarters or capital-city addresses.

## Boundaries

There is no external geocoder or automatic address lookup in this delivery. Localities are builder-entered; pins are manual. Country/island hierarchy and coordinate ranges are validated, but coordinates are not verified against international boundary polygons. Public copy presents the location as supplied by the builder. Tile availability depends on the external map provider; coordinate entry remains available if the map cannot load.

## Verification

Automated: 192 checks passed in the two-worker full run; three new geography checks initially hit a duplicated publisher test fixture, which was corrected. The three checks then passed in a focused rerun (195 checks verified overall). A first unrestricted full run timed out starting database containers concurrently; no application assertions ran in those suites.

Browser: public map rendered at 1280 px and 390 px with no horizontal overflow. Authenticated browser checks confirmed rounded pins persist in drafts, refresh recovery, publication and owner editing. An edit added a Porto secondary base while retaining the Tokyo pin. A coordinate-input reset on late map initialization was found and corrected. Secondary-base map filtering was verified in the browser. Country/island filters now apply to the displayed bases and selection focus as well as project matching. World-scale country aggregates expand into regional aggregates/public pins as the map is zoomed. API coverage verifies the secondary-country filter.
