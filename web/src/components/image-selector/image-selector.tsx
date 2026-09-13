import { useUpload } from "@/hooks/use-upload";
import { useImagePreview } from "@/modules/submit/hooks/use-image-preview";
import { formatBytes } from "@/utils/format-bytes";
import type { FileUploadType } from "@hubdigital/shared";
import {
  ActionIcon,
  Avatar,
  Button,
  Collapse,
  FileButton,
  Flex,
  Input,
  Progress,
  Stack,
  Text,
} from "@mantine/core";
import { IconPhoto, IconPhotoPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

const ACCEPTED = "image/png,image/jpeg,image/webp";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

type ImageSelectorProps = {
  label: string;
  /** Storage folder the file belongs to. */
  type: FileUploadType;
  /** Storage key of a file uploaded in this session, if any. */
  value?: string | null;
  /** Public URL of an image already saved on the record, shown until replaced. */
  previewUrl?: string;
  onChange: (fileKey: string | null) => void;
  recomandations?: string;
  actionLabel?: string;
  required?: boolean;
  error?: string;
};

export function ImageSelector({
  label,
  type,
  value,
  previewUrl,
  onChange,
  recomandations,
  actionLabel = "Carregar imagem",
  required = false,
  error,
}: ImageSelectorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>();
  const preview = useImagePreview(file);
  const { upload, percentage, isUploading } = useUpload();

  async function handleSelect(selected: File | null) {
    if (!selected) return;

    if (selected.size > MAX_SIZE_BYTES) {
      setUploadError(
        `A imagem excede o limite de ${formatBytes(MAX_SIZE_BYTES)}.`
      );
      return;
    }

    setUploadError(undefined);
    setFile(selected);

    try {
      onChange(await upload(selected, type));
    } catch {
      setFile(null);
      onChange(null);
      setUploadError("Não foi possível carregar a imagem. Tente novamente.");
    }
  }

  function handelRemove() {
    setFile(null);
    setUploadError(undefined);
    onChange(null);
  }

  const hasImage = Boolean(file || value || (previewUrl && value !== null));
  const message = uploadError ?? error;

  return (
    <Stack gap={"xxs"} align="flex-start" w={"100%"}>
      <Flex align={"center"} justify={"space-between"} w={"100%"}>
        <Input.Wrapper label={label} withAsterisk={required}></Input.Wrapper>
        <Text c={"dimmed"} size="sm">
          {recomandations}
        </Text>
      </Flex>

      <Collapse in={!hasImage}>
        <FileButton onChange={handleSelect} accept={ACCEPTED}>
          {(props) => (
            <Button
              {...props}
              loading={isUploading}
              leftSection={<IconPhotoPlus size={18} />}
            >
              {actionLabel}
            </Button>
          )}
        </FileButton>
      </Collapse>

      <Collapse in={hasImage} w={"100%"}>
        <Flex justify={"space-between"} align={"center"}>
          <Flex gap={"xs"}>
            <Avatar size={60} radius={6} src={preview?.url ?? previewUrl}>
              <IconPhoto
                size={35}
                color="var(--mantine-color-dimmed)"
                stroke={1.5}
              />
            </Avatar>

            <Stack gap={0}>
              <Text maw={140} lineClamp={1}>
                {file?.name ?? "Imagem atual"}
              </Text>
              {preview && (
                <>
                  <Text size="sm" c={"dimmed"}>
                    {formatBytes(preview.size)}
                  </Text>
                  <Text size="sm" c={"dimmed"}>
                    {preview.width}/{preview.height}
                  </Text>
                </>
              )}
            </Stack>
          </Flex>

          <ActionIcon
            mr={18}
            variant="light"
            size={40}
            color="red.6"
            disabled={isUploading}
            onClick={handelRemove}
          >
            <IconTrash size={18}></IconTrash>
          </ActionIcon>
        </Flex>
      </Collapse>

      {isUploading && (
        <Progress w={"100%"} value={percentage ?? 0} size="sm" animated />
      )}

      {message && (
        <Text size="sm" c="red.6">
          {message}
        </Text>
      )}
    </Stack>
  );
}
