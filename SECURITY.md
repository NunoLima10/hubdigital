# Security configuration

## Database

Copy `.env.example` to `.env`, generate a unique `HUBDIGITAL_DB_PASSWORD`, and
use that password in `api/.env`'s `DATABASE_URL` (URL-encoded where necessary).
Docker publishes PostgreSQL only on `127.0.0.1`.

Changing the Compose environment does not rotate the password in an existing
PostgreSQL volume. Rotate that database's password separately and update its
clients; do not delete a volume containing data to apply a password change.

## First administrator

Run the admin seed before exposing public registration. The seed creates the
configured account and promotes only the returned user ID. It leaves existing
admins unchanged and refuses to promote an existing ordinary account. Resolve
an occupied admin email through an operator-controlled recovery process after
verifying ownership; do not bypass this check with automatic email-based promotion.

The demo admin is restricted to development. Never reuse a development database
or its demo credentials for production. If an earlier deployment ran the old
admin seed after public registration opened, review admin identities and revoke
sessions for any untrusted account.

## Images and R2

The browser allocates an upload, then sends its image to the authenticated API
`PUT /v1/uploads/:id/content`. The API enforces the 5 MB body limit, ownership,
declared size and MIME type, and a 16 megapixel decoding limit. It fully decodes
and re-encodes PNG, JPEG and WebP images before writing them to R2. Animated
images are rejected. Completed objects cannot be replaced through the API.
The completion endpoint is an idempotent confirmation of that verified write.

The API host/reverse proxy must allow request bodies up to 5 MB. Storage write
credentials belong only to the API; clients no longer need bucket PUT CORS
access. Deploy the API and web changes together. Previously issued presigned
URLs remain valid until their original expiry; allow them to expire before
considering the old direct-upload flow retired. Review and remove orphaned
objects left by the old flow using storage inventory, without deleting objects
referenced by projects or accounts.

## Dependency checks

Use `pnpm audit` after dependency changes and run API and web tests plus all app
builds. Treat development-tool advisories according to their exposure, while
keeping UI/debug servers private. Do not suppress an advisory merely to make
an audit pass.
