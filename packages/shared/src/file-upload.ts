export const fileUploadTypeValues = ["project_logo", "project_gallery"] as const;

export type FileUploadType = (typeof fileUploadTypeValues)[number];

export const allowedUploadContentTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type AllowedUploadContentType =
  (typeof allowedUploadContentTypes)[number];

export const maxUploadBytes = 5 * 1024 * 1024;
