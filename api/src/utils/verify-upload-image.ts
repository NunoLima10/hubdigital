import sharp from "sharp";
import { maxUploadBytes } from "@hubdigital/shared";
import { BadRequestError } from "./custom-errors";

const formats = { "image/png": "png", "image/jpeg": "jpeg", "image/webp": "webp" } as const;

/** Decode every pixel and re-encode to discard trailing payloads and metadata. */
export async function verifyUploadImage(input: Buffer, contentType: string) {
  try {
    const format = formats[contentType as keyof typeof formats];
    if (!format || input.length > maxUploadBytes) throw new Error("Invalid image");
    const image = sharp(input, { limitInputPixels: 16_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (metadata.format !== format || (metadata.pages ?? 1) !== 1) throw new Error("Invalid image");
    const output = await image.toFormat(format).toBuffer();
    if (output.length > maxUploadBytes) throw new Error("Image too large");
    return output;
  } catch {
    throw new BadRequestError("O ficheiro não é uma imagem PNG, JPG ou WebP válida (máximo 16 megapíxeis).");
  }
}
