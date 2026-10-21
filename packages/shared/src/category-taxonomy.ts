export const categoryGroupLabels = {
  technology: "Tecnologia",
  work: "Trabalho",
  economy: "Vida local",
  public: "Serviços públicos e bem-estar",
  culture: "Cultura e comunidade",
  environment: "Ambiente e produção",
  other: "Outras categorias",
} as const;

export const categoryCatalog = [
  { key: "developer_tools", name: "Ferramentas para Programadores", group: "technology", aliases: "developer dev ferramentas" },
  { key: "ai", name: "Inteligência Artificial", group: "technology", aliases: "ia ai" },
  { key: "apis", name: "APIs", group: "technology", aliases: "api endpoints backend sdk" },
  { key: "integrations", name: "Integrações", group: "technology", aliases: "integrations conectores sincronização" },
  { key: "automation", name: "Automação", group: "technology", aliases: "automation workflows fluxos bots rpa" },
  { key: "no_code", name: "No-code e low-code", group: "technology", aliases: "nocode no code lowcode low code construtores visuais" },
  { key: "cloud", name: "Infraestrutura cloud", group: "technology", aliases: "cloud nuvem servidores infraestrutura" },
  { key: "devops", name: "DevOps", group: "technology", aliases: "devops ci cd pipelines deploy containers kubernetes" },
  { key: "databases", name: "Bases de dados", group: "technology", aliases: "database databases sql postgres armazenamento" },
  { key: "testing", name: "Testes de software", group: "technology", aliases: "testing qa qualidade testes" },
  { key: "observability", name: "Monitorização", group: "technology", aliases: "monitoring observability logs métricas desempenho" },
  { key: "hosting", name: "Alojamento web", group: "technology", aliases: "hosting hospedagem domínios websites" },
  { key: "machine_learning", name: "Machine learning", group: "technology", aliases: "aprendizagem automática modelos ml" },
  { key: "ai_agents", name: "Agentes de IA", group: "technology", aliases: "ai agents agentes inteligência artificial assistentes" },
  { key: "computer_vision", name: "Visão computacional", group: "technology", aliases: "computer vision imagens reconhecimento visual" },
  { key: "speech_technology", name: "Tecnologia de voz", group: "technology", aliases: "speech voz transcrição reconhecimento fala tts stt" },
  { key: "blockchain", name: "Blockchain", group: "technology", aliases: "blockchain web3 cripto contratos inteligentes" },
  { key: "iot", name: "Internet das coisas", group: "technology", aliases: "iot dispositivos sensores conectados" },
  { key: "robotics", name: "Robótica", group: "technology", aliases: "robotics robôs robots hardware" },
  { key: "productivity", name: "Produtividade", group: "work", aliases: "tarefas organização" },
  { key: "collaboration", name: "Colaboração", group: "work", aliases: "equipas colaboração" },
  { key: "marketing", name: "Marketing", group: "work", aliases: "publicidade" },
  { key: "sales", name: "Vendas", group: "work", aliases: "crm comercial" },
  { key: "design", name: "Design", group: "work", aliases: "criatividade" },
  { key: "data_analytics", name: "Dados & Análise", group: "technology", aliases: "analytics análise dados" },
  { key: "cybersecurity", name: "Cibersegurança", group: "technology", aliases: "segurança cybersecurity" },
  { key: "privacy", name: "Privacidade", group: "technology", aliases: "proteção de dados" },
  { key: "hr", name: "Emprego", group: "work", aliases: "recrutamento trabalho vagas" },
  { key: "people_management", name: "Gestão de pessoas", group: "work", aliases: "recursos humanos talento rh" },
  { key: "fintech", name: "Finanças", group: "economy", aliases: "fintech contabilidade remessas" },
  { key: "payments", name: "Pagamentos", group: "economy", aliases: "pagamento cobrança" },
  { key: "ecommerce", name: "Comércio eletrónico", group: "economy", aliases: "ecommerce lojas marketplace" },
  { key: "local_services", name: "Serviços locais", group: "economy", aliases: "serviços negócios locais" },
  { key: "transport", name: "Transportes", group: "economy", aliases: "mobilidade viagens inter ilhas" },
  { key: "logistics", name: "Logística", group: "economy", aliases: "entregas distribuição" },
  { key: "travel", name: "Turismo", group: "economy", aliases: "viagens alojamento reservas" },
  { key: "housing", name: "Imobiliário", group: "economy", aliases: "habitação casas arrendamento" },
  { key: "govtech", name: "Governo", group: "public", aliases: "serviços públicos govtech" },
  { key: "citizenship", name: "Cidadania", group: "public", aliases: "participação cívica" },
  { key: "education", name: "Educação", group: "public", aliases: "aprendizagem escolas cursos" },
  { key: "health", name: "Saúde", group: "public", aliases: "medicina cuidados" },
  { key: "wellbeing", name: "Bem-estar", group: "public", aliases: "bem estar hábitos fitness" },
  { key: "social", name: "Comunidades", group: "culture", aliases: "social comunidade redes" },
  { key: "social_impact", name: "Impacto social", group: "culture", aliases: "inclusão voluntariado solidariedade" },
  { key: "entertainment", name: "Media", group: "culture", aliases: "notícias conteúdo audiovisual" },
  { key: "culture", name: "Cultura", group: "culture", aliases: "património artes história" },
  { key: "music", name: "Música", group: "culture", aliases: "músicos áudio" },
  { key: "languages", name: "Línguas", group: "culture", aliases: "idiomas kriolu crioulo tradução" },
  { key: "games", name: "Jogos", group: "culture", aliases: "gaming games videojogos" },
  { key: "sports", name: "Desporto", group: "culture", aliases: "esporte competições clubes" },
  { key: "agritech", name: "Agricultura", group: "environment", aliases: "agritech cultivo" },
  { key: "fishing", name: "Pesca", group: "environment", aliases: "pescas mar peixe" },
  { key: "environment", name: "Ambiente", group: "environment", aliases: "sustentabilidade ecologia" },
  { key: "energy", name: "Energia", group: "environment", aliases: "solar eletricidade" },
  { key: "water", name: "Água", group: "environment", aliases: "água irrigação saneamento" },
  { key: "other", name: "Outro", group: "other", aliases: "outros" },
] as const;

type BrowsableCategory = { key: string; name: string };
export const normalizeCategorySearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function categoryMatchesSearch(category: BrowsableCategory, search: string) {
  const definition = categoryCatalog.find(({ key }) => key === category.key);
  return normalizeCategorySearch(`${category.name} ${definition?.aliases ?? ""}`).includes(normalizeCategorySearch(search.trim()));
}

// Groups organize the picker; they are not project memberships. New categories
// created by moderators remain selectable under Other until curated here.
export function groupCategories<T extends BrowsableCategory>(categories: T[]) {
  return Object.entries(categoryGroupLabels).map(([key, label]) => ({
    key, label,
    categories: categories.filter((category) => (categoryCatalog.find((item) => item.key === category.key)?.group ?? "other") === key)
      .sort((a, b) => a.name.localeCompare(b.name, "pt")),
  })).filter((group) => group.categories.length > 0);
}

// The initial suggestions reflect the builder/technology focus. Search still
// covers every category, and the full browser retains all browsing groups.
const quickCategoryKeys = [
  "ai", "developer_tools", "apis", "automation", "no_code", "data_analytics",
  "cloud", "cybersecurity", "productivity", "design", "integrations", "databases",
  "devops", "ai_agents", "testing", "observability", "hosting", "machine_learning",
  "computer_vision", "speech_technology", "iot", "robotics", "blockchain", "privacy",
];
export function categorySuggestions<T extends BrowsableCategory>(categories: T[], search = "", limit = 12) {
  const rank = (key: string) => {
    const index = quickCategoryKeys.indexOf(key);
    return index === -1 ? quickCategoryKeys.length : index;
  };
  return categories.filter((category) => categoryMatchesSearch(category, search))
    .sort((a, b) => rank(a.key) - rank(b.key) || a.name.localeCompare(b.name, "pt"))
    .slice(0, limit);
}
