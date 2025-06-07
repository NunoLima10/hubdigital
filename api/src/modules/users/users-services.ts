import { DB } from "@/db";
import {
  AccountInsertModel,
  accounts,
  profiles,
  ProfilInsertModel,
} from "@/db/schemas";
import { errorLogger } from "@/utils/error-logger";

async function createProfile(db: DB, values: ProfilInsertModel) {
  const [result] = await db.insert(profiles).values(values).returning({
    id: profiles.id,
  });
  return result;
}
async function createAccount(db: DB, values: AccountInsertModel) {
  const [result] = await db.insert(accounts).values(values).returning({
    id: profiles.id,
  });
  return result;
}

export const usersService = {
  createProfile: errorLogger(createProfile, "usersService.createProfile"),
  createAccount: errorLogger(createAccount, "usersService.createAccount"),
};
