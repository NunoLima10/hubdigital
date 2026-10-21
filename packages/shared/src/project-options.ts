export const pricingValues = ["free", "freemium", "paid", "contact_for_quote", "not_decided", "not_applicable"] as const;
export type ProjectPricing = (typeof pricingValues)[number];
export const platformValues = ["web", "android", "ios", "desktop", "api", "cli", "library", "browser_extension", "hardware", "other"] as const;
export const businessModelValues = ["b2b", "b2c", "b2g", "c2c"] as const;
export const availabilityValues = ["not_available", "waitlist", "invite_only", "public_beta", "available", "unavailable"] as const;
export const sourceModelValues = ["open_source", "source_available", "proprietary", "not_applicable", "not_disclosed"] as const;
export const projectStageValues = ["idea", "building", "prototype", "live", "paused", "discontinued"] as const;
export const audienceValues = ["students", "developers", "businesses", "government", "general_public"] as const;
