import { getYoutubeVideoId, youtubeVideoUrlSchema } from "@hubdigital/shared";
import { describe, expect, it } from "vitest";

describe("YouTube video URLs", () => {
  it.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://youtube.com/live/dQw4w9WgXcQ",
  ])("extracts the video id from %s", (url) => {
    expect(getYoutubeVideoId(url)).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoUrlSchema.safeParse(url).success).toBe(true);
  });

  it.each([
    "https://example.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/watch?v=too-short",
    "not-a-url",
  ])("rejects %s", (url) => {
    expect(getYoutubeVideoId(url)).toBeNull();
    expect(youtubeVideoUrlSchema.safeParse(url).success).toBe(false);
  });
});
