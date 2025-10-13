import { config } from "@/config";
import pino from "pino";

const isDev = config.NODE_ENV !== "production";

export const loggerOptions = {
  level: config.LOG_LEVEL,
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
