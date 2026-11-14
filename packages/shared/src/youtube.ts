import { z } from "zod";

const youtubeVideoIdPattern = /^[A-Za-z0-9_-]{11}$/;

/** Extracts a video id from the YouTube URL formats people commonly paste. */
export function getYoutubeVideoId(value: string): string | null {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;

    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let candidate: string | null = null;

    if (host === "youtu.be") {
      candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      if (url.pathname === "/watch") candidate = url.searchParams.get("v");
      else {
        const [kind, id] = url.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(kind)) candidate = id ?? null;
      }
    }

    return candidate && youtubeVideoIdPattern.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export const youtubeVideoUrlSchema = z
  .string()
  .url("Informe um link válido do YouTube.")
  .refine((value) => Boolean(getYoutubeVideoId(value)), {
    message: "Informe um link válido de um vídeo do YouTube.",
  });
