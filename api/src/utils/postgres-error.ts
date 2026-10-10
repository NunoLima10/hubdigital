import { DrizzleQueryError } from "drizzle-orm";
import { PostgresError } from "postgres";

/** Drizzle wraps driver errors; constraint handling needs the original cause. */
export function getPostgresError(error: unknown): PostgresError | undefined {
  const cause = error instanceof DrizzleQueryError ? error.cause : error;
  return cause instanceof PostgresError ? cause : undefined;
}
