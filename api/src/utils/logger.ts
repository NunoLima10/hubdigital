import pino from "pino";
import { env } from "./env";

const isDev = env.NODE_ENV !== "production";

export const loggerOptions = {
  level: env.LOG_LEVEL,
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  redact: ["DATABASE_URL"],
};

export const logger = pino(loggerOptions);
