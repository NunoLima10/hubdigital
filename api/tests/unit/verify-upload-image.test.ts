import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { verifyUploadImage } from "@/utils/verify-upload-image";

describe("full image verification", () => {
  it.each(["png", "jpeg", "webp"] as const)("decodes and re-encodes %s images without trailing payloads", async (format) => {
    const original = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).toFormat(format).toBuffer();
    const bytes = Buffer.concat([original, Buffer.from("<script>untrusted trailing payload</script>")]);
    const verified = await verifyUploadImage(bytes, `image/${format}`);
    expect(verified.includes(Buffer.from("<script>"))).toBe(false);
    expect((await sharp(verified).metadata()).format).toBe(format);
  });
  it("rejects images whose signature is valid but whose pixels are missing", async () => {
    await expect(verifyUploadImage(Buffer.from([137,80,78,71,13,10,26,10]), "image/png")).rejects.toThrow();
  });
  it("rejects a real image declared with a different MIME type", async () => {
    const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: "red" } }).png().toBuffer();
    await expect(verifyUploadImage(png, "image/jpeg")).rejects.toThrow();
  });
  it("rejects decompression bombs with more than 16 million pixels", async () => {
    const png = await sharp({ create: { width: 4001, height: 4000, channels: 3, background: "red" } }).png().toBuffer();
    await expect(verifyUploadImage(png, "image/png")).rejects.toThrow();
  });
});
