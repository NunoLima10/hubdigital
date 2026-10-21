CREATE TABLE "project_secondary_categories" (
	"project_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "project_secondary_categories_project_id_category_id_pk" PRIMARY KEY("project_id","category_id"),
	CONSTRAINT "project_secondary_categories_position_check" CHECK ("project_secondary_categories"."position" in (0, 1))
);
--> statement-breakpoint
ALTER TABLE "project_secondary_categories" ADD CONSTRAINT "project_secondary_categories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_secondary_categories" ADD CONSTRAINT "project_secondary_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_secondary_categories_position_idx" ON "project_secondary_categories" USING btree ("project_id","position");--> statement-breakpoint
CREATE INDEX "project_secondary_categories_category_idx" ON "project_secondary_categories" USING btree ("category_id","project_id");
--> statement-breakpoint
INSERT INTO categories (key, name) VALUES
('developer_tools', 'Ferramentas para Programadores'),
('ai', 'Inteligência Artificial'),
('fintech', 'Finanças & Pagamentos'),
('ecommerce', 'Comércio & Serviços locais'),
('productivity', 'Produtividade & Colaboração'),
('marketing', 'Marketing & Vendas'),
('design', 'Design & Criatividade'),
('data_analytics', 'Dados & Analytics'),
('cybersecurity', 'Segurança & Privacidade'),
('hr', 'Emprego & Talento'),
('logistics', 'Transportes & Logística'),
('agritech', 'Agricultura & Pesca'),
('govtech', 'Governo & Cidadania'),
('education', 'Educação & Aprendizagem'),
('health', 'Saúde & Bem-estar'),
('travel', 'Turismo & Viagens'),
('social', 'Comunidade & Impacto social'),
('entertainment', 'Media & Entretenimento'),
('environment', 'Ambiente, Energia & Água'),
('housing', 'Imobiliário & Habitação'),
('culture', 'Cultura, Música & Línguas'),
('games', 'Jogos & Desporto'),
('ocean', 'Economia do mar'),
('other', 'Outro')
ON CONFLICT (key) DO UPDATE SET name = excluded.name;
--> statement-breakpoint
UPDATE projects SET source_model = coalesce(source_model, 'open_source')
WHERE category_id IN (SELECT id FROM categories WHERE key = 'open_source');
--> statement-breakpoint
UPDATE projects SET category_id = (SELECT id FROM categories WHERE key = 'other')
WHERE category_id IN (SELECT id FROM categories WHERE key IN ('saas', 'open_source'));
--> statement-breakpoint
DELETE FROM categories WHERE key IN ('saas', 'open_source');
--> statement-breakpoint
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
