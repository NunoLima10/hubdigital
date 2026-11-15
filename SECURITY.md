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

The browser allocates an upload through the authenticated API and receives a
short-lived presigned R2 PUT URL. It sends the bytes directly to an
`unverified/<upload-id>` staging key, then calls the authenticated completion
endpoint. The API checks ownership, declared size and MIME type, downloads the
staged object, enforces the 5 MB and 16 megapixel limits, and fully decodes and
re-encodes PNG, JPEG and WebP images before writing the permanent object.
Animated images are rejected.

Only the permanent key is stored on projects and accounts. Because the
presigned URL can write only to its staging key, it cannot replace a completed
image while the URL remains valid. Completion is idempotent and removes the
staged object after the permanent object and database record are committed.

R2 bucket CORS must allow `PUT` from every deployed web origin and allow the
`Content-Type` request header. Storage credentials remain API-only; the browser
receives only a scoped URL that expires after `UPLOADER_URL_EXPIRES_IN` seconds
(300 by default). Review and remove abandoned `unverified/` objects with a
storage lifecycle rule or inventory cleanup.

## Dependency checks

Use `pnpm audit` after dependency changes and run API and web tests plus all app
builds. Treat development-tool advisories according to their exposure, while
keeping UI/debug servers private. Do not suppress an advisory merely to make
an audit pass.
