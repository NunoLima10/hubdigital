import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { matchesImageSignature } from '@/utils/image-signature';
import { maxUploadBytes } from '@hubdigital/shared';
import type { DB } from '@/db';
import { categories, fileUploads, projectImages, projectLinks, projects, publishers, users } from '@/db/schemas';
import { eq } from 'drizzle-orm';
import data from './data/airtable-startups.json';

const makerNames = [
  'Ana Monteiro', 'Carlos Tavares', 'Beatriz Lopes', 'Dário Santos',
  'Elisa Fernandes', 'Fábio Correia', 'Graça Silva', 'Hélio Andrade',
  'Inês Rodrigues', 'João Mendes', 'Lúcia Pires', 'Mário Semedo',
];

// Fictional makers: these profiles do not represent the companies' real owners.
export default async function seedAirtableProjects(db: DB) {
  await db.transaction(async (tx) => {
    const makerIds: number[] = [];
    for (const [index, name] of makerNames.entries()) {
      const userId = `seed-airtable-maker-${index + 1}`;
      await tx.insert(users).values({
        id: userId, name, email: `maker${index + 1}@example.invalid`,
        role: 'user', onboardedAt: new Date(`${data.capturedAt}T00:00:00Z`),
      }).onConflictDoNothing({ target: users.id });
      await tx.insert(publishers).values({
        userId, handle: `demo-maker-${index + 1}`,
        bio: `${name} — perfil fictício para testar a comunidade Hub Digital.`,
        profileResponse: index % 3 === 0 ? 'student' : index % 3 === 1 ? 'founder' : 'technology-professional',
        objectiveResponse: index % 2 === 0 ? 'launch-product' : 'networking',
        locationResponse: index % 2 === 0 ? 'CV7' : 'CV2',
        foundUsByResponse: index % 2 === 0 ? 'friends' : 'event',
      }).onConflictDoNothing({ target: publishers.userId });
      const [publisher] = await tx.select().from(publishers).where(eq(publishers.userId, userId));
      makerIds.push(publisher.id);
    }
    const categoryRows = await tx.select().from(categories);
    for (const [index, record] of data.records.entries()) {
      const categoryKey = record.coreBusiness.toLowerCase() === 'saas' ? 'productivity'
        : record.coreBusiness === 'Fintech' ? 'fintech'
        : record.coreBusiness === 'Game' ? 'games' : 'other';
      const category = categoryRows.find(c => c.key === categoryKey);
      if (!category) throw new Error('Seed categories before Airtable projects');
      const publishedAt = new Date(`${data.capturedAt}T12:00:00Z`);
      publishedAt.setUTCDate(publishedAt.getUTCDate() - index * 2);
      const slug = `airtable-${record.sourceId}-${record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}`;
      await tx.insert(projects).values({
        publisherId: makerIds[index % makerIds.length], categoryId: category.id,
        name: record.name, slug,
        shortDescription: record.description?.replace('… Ver mais', '').slice(0, 160) || record.coreBusiness,
        description: record.description,
        logoUrl: `project_logo/seed-airtable-${record.sourceId}.${record.localImagePath.split(".").pop()}`,
        country: 'cv', island: record.island === 'São Vicente' ? 'CV2' : 'CV7',
        // Required fields absent from Airtable use explicit fixture defaults.
        pricing: 'paid', platform: ['web'], businessModel: record.businessModel === 'b2c' ? 'b2c' : 'b2b',
        sourceModel: 'proprietary', availability: 'available', projectStage: 'live', audiences: ['businesses'],
        status: 'published', publishedAt: publishedAt.toISOString(), launchedAt: publishedAt.toISOString(),
      }).onConflictDoUpdate({ target: projects.slug, set: {
        categoryId: category.id,
        logoUrl: `project_logo/seed-airtable-${record.sourceId}.${record.localImagePath.split(".").pop()}`,
        availability: 'available', sourceModel: 'proprietary', projectStage: 'live', audiences: ['businesses'],
      } });
      const [project] = await tx.select({ id: projects.id }).from(projects).where(eq(projects.slug, slug));
      const galleryKey = `project_gallery/seed-airtable-${record.sourceId}.${record.localImagePath.split(".").pop()}`;
      const logoKey = `project_logo/seed-airtable-${record.sourceId}.${record.localImagePath.split(".").pop()}`;
      const user = await tx.query.publishers.findFirst({ where: eq(publishers.id, makerIds[index % makerIds.length]), columns: { userId: true } });
      const bytes = await readFile(resolve(__dirname, '../../../../web/public', record.localImagePath.replace(/^\//, '')));
      const contentType = record.localImagePath.endsWith('.png') ? 'image/png' : record.localImagePath.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      if (!matchesImageSignature(bytes, contentType) || bytes.length > maxUploadBytes) throw new Error('Invalid seed image');
      for (const [key, type] of [[logoKey, 'project_logo'], [galleryKey, 'project_gallery']] as const) {
        await tx.insert(fileUploads).values({ key, type, userId: user!.userId, contentType, byteSize: bytes.length, completedAt: new Date().toISOString() }).onConflictDoNothing({ target: fileUploads.key });
      }
      await tx.insert(projectLinks).values({ projectId: project.id, kind: 'website', url: /^https?:\/\//.test(record.website) ? record.website : `https://${record.website}`, isPrimary: true, position: 0 }).onConflictDoNothing();
      await tx.delete(projectImages).where(eq(projectImages.projectId, project.id));
      await tx.insert(projectImages).values({
        projectId: project.id,
        storageKey: galleryKey,
        position: 0,
      }).onConflictDoNothing({ target: projectImages.storageKey });
    }
  });
}
