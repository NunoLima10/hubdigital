import { DB } from "@/db";
import { fileUploads } from "@/db/schemas";
import { errorLogger } from "@/utils/error-logger";
import { InferInsertModel, eq } from "drizzle-orm";

type CreateFileUploadInput = InferInsertModel<typeof fileUploads>;

async function createFileUpload(db: DB, values: CreateFileUploadInput) {
  const [result] = await db.insert(fileUploads).values(values).returning();

  return result;
}

async function findFileUploadByKey(db: DB, key: string) {
  return db.query.fileUploads.findFirst({
    where: eq(fileUploads.key, key),
  });
}

export const UploadsService = {
  createFileUpload: errorLogger(
    createFileUpload,
    "uploadsService.createFileUpload"
  ),
  findFileUploadByKey: errorLogger(
    findFileUploadByKey,
    "uploadsService.findFileUploadByKey"
  ),
};
