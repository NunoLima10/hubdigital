# Airtable startup fixtures

Eighteen sample records copied on 2026-10-10 from [Cabo Verde â€” Startup Database](https://airtable.com/appGsydkfn1oLYQco/shrEqU9DbVFhVhhl7/tblKkPhhqZg8ROraG): DevTrust Consulting, Sintaxy, Zing Developers, Chuva, Opentec, B.Systems and SilFer Bots. This is a sample, not a full export.

`airtable-startups.json` keeps the original visible fields and image URLs. DevTrust's visible description was truncated in the gallery and is preserved as such. Images were downloaded into `web/public/seed/airtable`; the project seed uses `/seed/airtable/<sourceId>.<png|jpg>`, served by the web app. For use in another frontend or deployment, upload those assets and replace the seed logo URLs with absolute hosted URLs. Original attachment URLs are retained for reference.

Run `pnpm api:db:seed` with the API configured for development, `DB_SEEDING=true`, and a migrated local `DATABASE_URL`. The existing seed runner inserts categories first, then these projects. Production seeding excludes these fixtures. Reruns skip existing fixture users, publishers and project slugs; they do not overwrite project edits.

Mapping: Santiago â†’ CV7; SÃ£o Vicente â†’ CV2; SaaS â†’ saas; IT Consulting â†’ other; Website gets an HTTPS prefix when absent. All fixture projects are published under 12 fictional makers, not the companies' actual owners. Short descriptions are clipped to 160 characters. Required pricing/platform/access/audience use test defaults (paid/web/closed_source/businesses); business model preserves b2c and simplifies mixed models to b2b and stage to growth. These defaults are not verified company facts. The JSON preserves the original mixed business models and stages. Missing banners and GitHub links remain empty.

The seed prepares database rows only when you run the command; copying these files does not modify your database.



Additional sample companies: ReserMar, Cabotech Solutions, Power Solutions, Bonako, mGo, LestoPay, Agui@net, Doutvisions, Nexus for Business, APay and XLERA. Records missing a website were excluded. Some gallery descriptions may be truncated at the source.

The 12 fictional makers have reserved example.invalid emails, different onboarding answers, and public handles demo-maker-1 through demo-maker-12. They have no password or authentication account: these are database and public-profile fixtures, not login users. Publication and launch dates are spread over 34 days from the capture date. Existing projects retain their original owners and dates when the seed is rerun.

