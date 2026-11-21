import { routeErrorResponses } from "@/shared/schemas";
import type { DB } from "@/db";
import { users } from "@/db/schemas";
import { count, isNull, or, eq, and } from "drizzle-orm";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

/**
 * Temporary: the launch raffle with Ola.cv (5 domains among the first
 * 100 accounts). Feeds the home sidebar's progress card. Remove this module,
 * its registration in server.ts and the card once the raffle is drawn.
 */
export const LAUNCH_CAMPAIGN = { goal: 100, prizes: 5 } as const;

const MEMO_TTL_MS = 60_000;
let memo: { users: number; expiresAt: number } | null = null;

/** Accounts that count toward the goal: every account not hard- or shadow-banned. */
async function countUsers(db: DB): Promise<number> {
  if (memo && memo.expiresAt > Date.now()) return memo.users;
  const [row] = await db
    .select({ total: count() })
    .from(users)
    .where(
      and(
        or(isNull(users.banned), eq(users.banned, false)),
        isNull(users.shadowBannedAt),
      ),
    );
  const total = Number(row?.total ?? 0);
  memo = { users: total, expiresAt: Date.now() + MEMO_TTL_MS };
  return total;
}

const launchCampaignSchema = z.object({
  users: z.number().int().nonnegative(),
  goal: z.number().int().positive(),
  prizes: z.number().int().positive(),
  reached: z.boolean(),
});

export type LaunchCampaign = z.infer<typeof launchCampaignSchema>;

export async function launchCampaignRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get("/", {
    schema: {
      tags: ["launch-campaign"],
      response: {
        200: z.object({ data: launchCampaignSchema }),
        ...routeErrorResponses,
      },
    },
    handler: async (req, reply) => {
      const total = await countUsers(req.db);
      reply.header("Cache-Control", "public, max-age=60");
      return reply.status(200).send({
        data: {
          users: total,
          goal: LAUNCH_CAMPAIGN.goal,
          prizes: LAUNCH_CAMPAIGN.prizes,
          reached: total >= LAUNCH_CAMPAIGN.goal,
        },
      });
    },
  });
}
