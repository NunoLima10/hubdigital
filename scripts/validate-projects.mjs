// Valida web/src/data/projects.json. Uso:
//   node scripts/validate-projects.mjs                 -> valida campos
//   node scripts/validate-projects.mjs --check-links   -> também verifica se os sites respondem
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const projects = JSON.parse(
  readFileSync(join(root, "web/src/data/projects.json"), "utf8")
);
const typesSource = readFileSync(
  join(root, "web/src/features/project-list/types/project.ts"),
  "utf8"
);

// As listas válidas vivem em project.ts, para não as duplicar aqui.
function readConstList(name) {
  const match = typesSource.match(
    new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const`)
  );
  if (!match) throw new Error(`Não foi possível ler ${name} de project.ts`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

const CATEGORIES = readConstList("CATEGORIES");
const ISLANDS = readConstList("ISLANDS");
const ALLOWED_KEYS = new Set([
  "slug", "name", "tagline", "description", "website", "iconUrl", "category",
  "tags", "island", "foundedYear", "makers", "github", "status", "addedAt",
  "upCount",
]);

const errors = [];
const slugs = new Set();
const websites = new Set();

function isUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

projects.forEach((p, i) => {
  const at = `#${i} (${p.slug ?? p.name ?? "?"})`;
  const fail = (msg) => errors.push(`${at}: ${msg}`);

  for (const key of Object.keys(p)) {
    if (!ALLOWED_KEYS.has(key)) fail(`campo desconhecido "${key}"`);
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug ?? ""))
    fail("slug deve ser minúsculas e hífens, ex: meu-projeto");
  else if (slugs.has(p.slug)) fail(`slug duplicado "${p.slug}"`);
  slugs.add(p.slug);

  if (!p.name?.trim()) fail("name é obrigatório");
  if (!p.tagline?.trim()) fail("tagline é obrigatória");
  else if (p.tagline.length > 120) fail("tagline deve ter até 120 caracteres");

  if (!isUrl(p.website ?? "")) fail("website deve ser um URL http(s)");
  else {
    const host = new URL(p.website).host.replace(/^www\./, "");
    if (websites.has(host)) fail(`website duplicado "${host}"`);
    websites.add(host);
  }

  if (!CATEGORIES.includes(p.category))
    fail(`category inválida. Opções: ${CATEGORIES.join(", ")}`);
  if (p.island !== undefined && !ISLANDS.includes(p.island))
    fail(`island inválida. Opções: ${ISLANDS.join(", ")}`);

  if (!Array.isArray(p.tags) || p.tags.some((t) => typeof t !== "string"))
    fail("tags deve ser uma lista de textos");
  else if (p.tags.length > 5) fail("máximo de 5 tags");

  if (p.iconUrl !== undefined) {
    if (!p.iconUrl.startsWith("/logos/"))
      fail("iconUrl deve apontar para /logos/<ficheiro>");
    else if (!existsSync(join(root, "web/public", p.iconUrl)))
      fail(`ficheiro não encontrado: web/public${p.iconUrl}`);
  }

  if (p.github !== undefined && !isUrl(p.github)) fail("github deve ser um URL");
  if (p.status !== undefined && !["active", "offline"].includes(p.status))
    fail('status deve ser "active" ou "offline"');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.addedAt ?? ""))
    fail("addedAt deve ter o formato AAAA-MM-DD");
  if (!Number.isInteger(p.upCount) || p.upCount < 0)
    fail("upCount deve ser um inteiro >= 0");
  if (
    p.foundedYear !== undefined &&
    (!Number.isInteger(p.foundedYear) || p.foundedYear < 1975)
  )
    fail("foundedYear inválido");
  if (
    p.makers !== undefined &&
    (!Array.isArray(p.makers) ||
      p.makers.some((m) => !m?.name || (m.url && !isUrl(m.url))))
  )
    fail("makers deve ser uma lista de { name, url? }");
});

if (process.argv.includes("--check-links")) {
  await Promise.all(
    projects.map(async (p) => {
      try {
        const res = await fetch(p.website, {
          redirect: "follow",
          signal: AbortSignal.timeout(15000),
        });
        const online = res.status < 500;
        if (!online && p.status !== "offline")
          errors.push(`${p.slug}: ${p.website} respondeu ${res.status}`);
        if (online && p.status === "offline")
          console.log(`ℹ ${p.slug} voltou a responder, remova "status": "offline"`);
      } catch (error) {
        if (p.status !== "offline")
          errors.push(`${p.slug}: ${p.website} inacessível (${error.cause?.code ?? error.name})`);
      }
    })
  );
}

if (errors.length) {
  console.error(`✖ ${errors.length} problema(s) em projects.json:\n`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`✔ ${projects.length} projetos válidos`);
