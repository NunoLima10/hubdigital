CREATE TABLE "site_stats_snapshots" (
	"day" date PRIMARY KEY NOT NULL,
	"payload" jsonb,
	"fetched_at" timestamp with time zone,
	"refreshing_at" timestamp with time zone
);
