export const CATEGORIES = [
  "Comunicação",
  "Comércio",
  "Desenvolvimento",
  "Educação",
  "Finanças",
  "Governo",
  "Informação",
  "Mobilidade",
  "Saúde",
  "Turismo",
  "Outros",
] as const;

export const ISLANDS = [
  "Santiago",
  "São Vicente",
  "Santo Antão",
  "São Nicolau",
  "Sal",
  "Boa Vista",
  "Maio",
  "Fogo",
  "Brava",
  "Diáspora",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Island = (typeof ISLANDS)[number];

export type Maker = {
  name: string;
  url?: string;
};

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  description?: string;
  website: string;
  iconUrl?: string;
  category: Category;
  tags: string[];
  island?: Island;
  foundedYear?: number;
  makers?: Maker[];
  github?: string;
  status?: "active" | "offline";
  addedAt: string;
  upCount: number;
};
