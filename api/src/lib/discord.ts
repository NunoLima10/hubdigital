import { config } from "@/config";
import { logger } from "@/utils/logger";

/**
 * Posts to Discord channels through incoming webhooks. Two channels:
 *
 * - `activity`: private, staff only. Reports, comments and projects that need
 *   or got a look. It may carry names and the text people wrote.
 * - `public`: anyone can read it. Only what is already public on the site.
 *
 * Delivery is fire-and-forget: a request never waits on Discord and never
 * fails because of it. A channel whose webhook is unset (local development,
 * tests, forks) is a no-op.
 */

export type DiscordChannel = "activity" | "public";

export type DiscordEmbed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  author?: { name: string; icon_url?: string };
  thumbnail?: { url: string };
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
};

export type DiscordMessage = {
  content?: string;
  embeds?: DiscordEmbed[];
};

const webhooks: Record<DiscordChannel, string | undefined> =
  config.NODE_ENV === "test"
    ? { activity: undefined, public: undefined }
    : {
        activity: config.DISCORD_ACTIVITY_WEBHOOK_URL,
        public: config.DISCORD_PUBLIC_WEBHOOK_URL,
      };

const TIMEOUT_MS = 5_000;

let muted = false;

/** Discord's own limits; past them the whole message is rejected. */
export function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

async function post(url: string, message: DiscordMessage) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Text written by users must not ping @everyone or a role.
    body: JSON.stringify({ ...message, allowed_mentions: { parse: [] } }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook answered ${response.status}`);
  }
}

export const discord = {
  enabled(channel: DiscordChannel) {
    return !muted && Boolean(webhooks[channel]);
  },

  /**
   * Silences every channel for this process. Seed scripts call it: the
   * accounts and projects they create are not activity anyone should hear of.
   */
  mute() {
    muted = true;
  },

  send(channel: DiscordChannel, message: DiscordMessage) {
    const url = webhooks[channel];
    if (!url || muted) return;

    post(url, message).catch((error) => {
      logger.warn({ err: error, channel }, "Discord notification failed");
    });
  },
};
