import { API } from "@/api/api";
import { endpoints } from "@/api/endpoints";
import { ItemResponse } from "@/types";
import type { FileUploadType } from "@hubdigital/shared";
import axios, { type AxiosProgressEvent } from "axios";
import { useState } from "react";

type PreSignedUpload = {
  uploadUrl: string;
  fileKey: string;
};

async function getPreSignedUrl(file: File, type: FileUploadType) {
  const response = await API.post<ItemResponse<PreSignedUpload>>(
    endpoints.uploads,
    {
      name: file.name,
      contentType: file.type,
      type,
    }
  );

  return response.data.data;
}

/**
 * Two-step upload: the API hands out a short-lived pre-signed URL, then the file
 * goes straight to R2 without passing through our server. What the caller keeps
 * is the storage key, which is what project records store.
 */
export function useUpload() {
  const [percentage, setPercentage] = useState<number>();

  function onUploadProgress(progressEvent: AxiosProgressEvent) {
    if (!progressEvent.total) return;

    setPercentage(
      Math.round((progressEvent.loaded * 100) / progressEvent.total)
    );
  }

  async function upload(file: File, type: FileUploadType) {
    setPercentage(1);

    try {
      const { uploadUrl, fileKey } = await getPreSignedUrl(file, type);

      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress,
      });

      return fileKey;
    } finally {
      setPercentage(undefined);
    }
  }

  return { upload, percentage, isUploading: percentage !== undefined };
}
