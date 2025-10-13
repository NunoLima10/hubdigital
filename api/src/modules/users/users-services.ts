import { DB } from "@/db";
import { PublisherInsertModel, publishers } from "@/db/schemas";

import { errorLogger } from "@/utils/error-logger";

async function createPublisher(db: DB, values: PublisherInsertModel) {
  const [result] = await db.insert(publishers).values(values).returning({
    id: publishers.id,
  });
  return result;
}

export const UserService = {
  createPublisher: errorLogger(createPublisher, "usersService.createPublisher"),
};
