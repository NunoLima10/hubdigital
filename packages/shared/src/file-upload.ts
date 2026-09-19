export const fileUploadTypeValues = ["project_logo", "project_banner"] as const;

export type FileUploadType = (typeof fileUploadTypeValues)[number];

export const allowedUploadContentTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

export type AllowedUploadContentType =
  (typeof allowedUploadContentTypes)[number];
