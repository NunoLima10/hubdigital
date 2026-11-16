-- The squashed baseline kept the badge tables but accidentally dropped the
-- catalog data that makes badge awards valid on a freshly migrated database.
INSERT INTO "badges" ("key", "award_mode", "sort_order") VALUES
	('founder', 'manual', 10),
	('maintainer', 'manual', 20),
	('founding-gold', 'automatic', 30),
	('founding-silver', 'automatic', 40),
	('founding-basalt', 'automatic', 50)
ON CONFLICT ("key") DO UPDATE SET
	"award_mode" = excluded."award_mode",
	"sort_order" = excluded."sort_order";
--> statement-breakpoint
-- Backfill founding badges for members who joined before this repair. The
-- partial featured index can also conflict, so any existing award wins.
INSERT INTO "user_badges" ("user_id", "badge_key", "awarded_at", "featured")
SELECT
	"user_id",
	CASE
		WHEN "membership_number" <= 10 THEN 'founding-gold'
		WHEN "membership_number" <= 50 THEN 'founding-silver'
		ELSE 'founding-basalt'
	END,
	"created_at",
	true
FROM "publishers"
WHERE "membership_number" BETWEEN 2 AND 100
ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- Secondary categories need a primary category distinct from all of them.
-- This cross-table rule must be a deferred constraint so an atomic primary
-- category swap can update both tables in either order.
CREATE OR REPLACE FUNCTION check_project_category_memberships()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	target_id integer;
BEGIN
	IF TG_TABLE_NAME = 'projects' THEN
		target_id := NEW.id;
	ELSE
		target_id := coalesce(NEW.project_id, OLD.project_id);
	END IF;

	IF EXISTS (
		SELECT 1
		FROM projects p
		JOIN project_secondary_categories membership
			ON membership.project_id = p.id
		WHERE p.id = target_id
			AND (p.category_id IS NULL OR p.category_id = membership.category_id)
	) THEN
		RAISE EXCEPTION 'Secondary categories require a distinct primary category'
			USING ERRCODE = '23514',
				CONSTRAINT = 'project_categories_distinct_primary';
	END IF;

	RETURN NULL;
END;
$$;
--> statement-breakpoint
-- Refuse to silently preserve invalid rows written while the triggers were
-- absent. Such rows need an explicit product decision before deployment.
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM projects p
		JOIN project_secondary_categories membership
			ON membership.project_id = p.id
		WHERE p.category_id IS NULL OR p.category_id = membership.category_id
	) THEN
		RAISE EXCEPTION 'Existing projects contain invalid category memberships'
			USING ERRCODE = '23514',
				CONSTRAINT = 'project_categories_distinct_primary';
	END IF;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS project_categories_primary_check ON projects;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER project_categories_primary_check
AFTER INSERT OR UPDATE ON projects
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION check_project_category_memberships();
--> statement-breakpoint
DROP TRIGGER IF EXISTS project_categories_secondary_check ON project_secondary_categories;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER project_categories_secondary_check
AFTER INSERT OR UPDATE OR DELETE ON project_secondary_categories
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION check_project_category_memberships();
