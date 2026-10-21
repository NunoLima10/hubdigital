-- Groups are picker navigation; only these specific categories are memberships.
INSERT INTO categories (key, name) VALUES
('developer_tools', 'Ferramentas para Programadores'),
('ai', 'Inteligência Artificial'),
('productivity', 'Produtividade'),
('collaboration', 'Colaboração'),
('marketing', 'Marketing'),
('sales', 'Vendas'),
('design', 'Design'),
('data_analytics', 'Dados & Análise'),
('cybersecurity', 'Cibersegurança'),
('privacy', 'Privacidade'),
('hr', 'Emprego'),
('people_management', 'Gestão de pessoas'),
('fintech', 'Finanças'),
('payments', 'Pagamentos'),
('ecommerce', 'Comércio eletrónico'),
('local_services', 'Serviços locais'),
('transport', 'Transportes'),
('logistics', 'Logística'),
('travel', 'Turismo'),
('housing', 'Imobiliário'),
('govtech', 'Governo'),
('citizenship', 'Cidadania'),
('education', 'Educação'),
('health', 'Saúde'),
('wellbeing', 'Bem-estar'),
('social', 'Comunidades'),
('social_impact', 'Impacto social'),
('entertainment', 'Media'),
('culture', 'Cultura'),
('music', 'Música'),
('languages', 'Línguas'),
('games', 'Jogos'),
('sports', 'Desporto'),
('agritech', 'Agricultura'),
('fishing', 'Pesca'),
('environment', 'Ambiente'),
('energy', 'Energia'),
('water', 'Água'),
('other', 'Outro')
ON CONFLICT (key) DO UPDATE SET name = excluded.name;
--> statement-breakpoint
-- Retire the broad ocean umbrella rather than treating it as another sector.
-- Development projects can refine Outro to fishing, transport or environment.
DELETE FROM project_secondary_categories WHERE category_id IN (SELECT id FROM categories WHERE key = 'ocean');
--> statement-breakpoint
UPDATE projects SET category_id = (SELECT id FROM categories WHERE key = 'other')
WHERE category_id IN (SELECT id FROM categories WHERE key = 'ocean');
--> statement-breakpoint
DELETE FROM project_secondary_categories membership USING projects p
WHERE membership.project_id = p.id AND membership.category_id = p.category_id;
--> statement-breakpoint
DELETE FROM categories WHERE key = 'ocean';
