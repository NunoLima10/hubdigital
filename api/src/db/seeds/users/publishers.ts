import { auth } from "@/lib/auth";
import { logger } from "@/utils/logger";

const publisherData = [
  {
    email: "demo.publisher@hubdigital.cv",
    name: "Demo publisher",
    password: "demo1234",
  },
];

export default async function seed() {
  try {
    for (const user of publisherData) {
      await auth.api.createUser({
        body: {
          email: user.email,
          name: user.name,
          password: user.password,
          role: "user",
        },
      });
    }

    logger.info("publisher user seeded successfully.");
  } catch (error) {
    logger.error(error, "Unexpected error during seeding");
  }
}
