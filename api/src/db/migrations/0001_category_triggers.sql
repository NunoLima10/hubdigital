-- Secondary categories need a primary category distinct from all of them. A
-- cross-table rule, so it lives in deferred constraint triggers rather than in
-- the Drizzle schema: a primary swap can complete inside one transaction.
CREATE FUNCTION check_project_category_memberships() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_id integer;
BEGIN
  IF TG_TABLE_NAME = 'projects' THEN target_id := NEW.id;
  ELSE target_id := coalesce(NEW.project_id, OLD.project_id);
  END IF;
  IF EXISTS (
    SELECT 1 FROM projects p JOIN project_secondary_categories m ON m.project_id = p.id
    WHERE p.id = target_id AND (p.category_id IS NULL OR p.category_id = m.category_id)
  ) THEN
    RAISE EXCEPTION 'Secondary categories require a distinct primary category'
      USING ERRCODE = '23514', CONSTRAINT = 'project_categories_distinct_primary';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER project_categories_primary_check
AFTER INSERT OR UPDATE ON projects DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION check_project_category_memberships();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER project_categories_secondary_check
AFTER INSERT OR UPDATE OR DELETE ON project_secondary_categories DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION check_project_category_memberships();
