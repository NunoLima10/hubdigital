import { badgeCatalog, type BadgeKey } from "@hubdigital/shared";

/** The badge's accessible name, e.g. "Primeiros 10 · Ouro · Membro #7". */
export function badgeLabel(badgeKey: BadgeKey, membershipNumber?: number) {
  const badge = badgeCatalog[badgeKey];
  const member =
    membershipNumber && badgeKey.startsWith("founding-")
      ? ` · Membro #${membershipNumber}`
      : "";
  return `${badge.name} · ${badge.material}${member}`;
}
