-- Expand the technology catalog without changing existing memberships.
INSERT INTO categories (key, name) VALUES
('apis', 'APIs'),
('integrations', 'Integrações'),
('automation', 'Automação'),
('no_code', 'No-code e low-code'),
('cloud', 'Infraestrutura cloud'),
('devops', 'DevOps'),
('databases', 'Bases de dados'),
('testing', 'Testes de software'),
('observability', 'Monitorização'),
('hosting', 'Alojamento web'),
('machine_learning', 'Machine learning'),
('ai_agents', 'Agentes de IA'),
('computer_vision', 'Visão computacional'),
('speech_technology', 'Tecnologia de voz'),
('blockchain', 'Blockchain'),
('iot', 'Internet das coisas'),
('robotics', 'Robótica')
ON CONFLICT (key) DO UPDATE SET name = excluded.name;
