import { fileUploadTypeValues } from "@hubdigital/shared";
import { index, pgEnum, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { timestamps } from "./timestamps";

export const fileUploadTypeEnum = pgEnum("file_upload_type", fileUploadTypeValues);

export const fileUploads = pgTable(
  "file_uploads",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: fileUploadTypeEnum("type").notNull(),
    contentType: varchar("content_type", { length: 100 }),
    ...timestamps,
  },
  (table) => [index("file_uploads_user_id_idx").on(table.userId)]
);
