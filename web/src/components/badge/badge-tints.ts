import type { BadgeKey } from "@hubdigital/shared";

/** Each badge's signature colour, used to tint the reveal card and its glow. */
export const badgeTints: Record<BadgeKey, string> = {
  founder: "#3A94FF",
  "founding-gold": "#F4C542",
  "founding-silver": "#9AA6B6",
  "founding-basalt": "#FF6A13",
  maintainer: "#34C98F",
};
