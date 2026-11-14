import { API } from "@/api/api";
import { endpoints } from "@/api/endpoints";
import { ItemResponse } from "@/types";
import type { FileUploadType } from "@hubdigital/shared";
import axios, { type AxiosProgressEvent } from "axios";
import { useState } from "react";

type UploadAllocation = {
  uploadUrl: string;
  fileKey: string;
  uploadId: number;
};

async function createUpload(file: File, type: FileUploadType) {
  const response = await API.post<ItemResponse<UploadAllocation>>(
    endpoints.uploads,
    {
      name: file.name,
      contentType: file.type,
      type,
      byteSize: file.size,
    }
  );

  return response.data.data;
}

/**
 * The API validates and decodes the bounded image before storing it in R2.
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
      const { uploadUrl, fileKey, uploadId } = await createUpload(file, type);

      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
        withCredentials: true,
        onUploadProgress,
      });

      await API.post(`/uploads/${uploadId}/complete`);

      return fileKey;
    } finally {
      setPercentage(undefined);
    }
  }

  return { upload, percentage, isUploading: percentage !== undefined };
}
