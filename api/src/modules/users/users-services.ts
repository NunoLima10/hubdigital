import { DB } from "@/db";
import { fileUploads, PublisherInsertModel, publishers, users } from "@/db/schemas";
import { toPublicUrl } from "@/utils/public-url";
import { and, eq, isNotNull } from "drizzle-orm";

import { errorLogger } from "@/utils/error-logger";

async function createPublisher(db: DB, values: PublisherInsertModel) {
  const [result] = await db.insert(publishers).values(values).returning({
    id: publishers.id,
  });
  return result;
}

/**
 * Points the account photo at one of the user's own finished avatar uploads,
 * or clears it. The URL is stored resolved, like the one Google sign-in
 * writes, because the session hands users.image to the browser as-is.
 * Returns undefined when the key is not such an upload.
 */
async function updateAvatar(db: DB, userId: string, key: string | null) {
  if (key) {
    const upload = await db.query.fileUploads.findFirst({
      where: and(
        eq(fileUploads.key, key),
        eq(fileUploads.userId, userId),
        eq(fileUploads.type, "user_avatar"),
        isNotNull(fileUploads.completedAt),
      ),
    });
    if (!upload) return undefined;
  }
  const image = toPublicUrl(key);
  await db.update(users).set({ image }).where(eq(users.id, userId));
  return image;
}

export const UserService = {
  createPublisher: errorLogger(createPublisher, "usersService.createPublisher"),
  updateAvatar: errorLogger(updateAvatar, "usersService.updateAvatar"),
};
