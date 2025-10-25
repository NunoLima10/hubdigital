import { useImagePreview } from "@/modules/submit/hooks/use-image-preview";
import { formatBytes } from "@/utils/format-bytes";
import {
  ActionIcon,
  Avatar,
  Button,
  Collapse,
  FileButton,
  Flex,
  Input,
  Stack,
  Text,
} from "@mantine/core";
import { IconPhoto, IconPhotoPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

type ImageSelectorProps = {
  label: string;
  recomandations?: string;
  actionLabel?: string;
};

export function ImageSelector({
  label,
  recomandations,
  actionLabel = " Carregar imagem",
}: ImageSelectorProps) {
  const [file, setFile] = useState<File | null>(null);
  const bannerPreview = useImagePreview(file);

  

  function handelRemove() {
    setFile(null);
  }

  return (
    <Stack gap={"xxs"} align="flex-start" w={"100%"}>
      <Flex align={"center"} justify={"space-between"} w={"100%"}>
        <Input.Wrapper label={label} withAsterisk></Input.Wrapper>
        <Text c={"dimmed"} size="sm">
          {recomandations}
        </Text>
      </Flex>
      <Collapse in={!file}>
        <FileButton onChange={setFile} accept="image/png,image/jpeg">
          {(props) => (
            <Button {...props} leftSection={<IconPhotoPlus size={18} />}>
              {actionLabel}
            </Button>
          )}
        </FileButton>
      </Collapse>
      <Collapse in={!!bannerPreview} w={"100%"}>
        <Flex justify={"space-between"} align={"center"}>
          <Flex gap={"xs"}>
            <Avatar size={60} radius={6} src={bannerPreview?.url}>
              <IconPhoto
                size={35}
                color="var(--mantine-color-dimmed)"
                stroke={1.5}
              />
            </Avatar>

            <Stack gap={0}>
              <Text maw={100} lineClamp={1}>
                {file?.name}
              </Text>
              <Text size="sm" c={"dimmed"}>
                {formatBytes(bannerPreview?.size ?? 0)}
              </Text>
              <Text size="sm" c={"dimmed"}>
                {bannerPreview?.width}/{bannerPreview?.height}
              </Text>
            </Stack>
          </Flex>

          <ActionIcon
            mr={18}
            variant="light"
            size={40}
            color="red.6"
            onClick={handelRemove}
          >
            <IconTrash size={18}></IconTrash>
          </ActionIcon>
        </Flex>
      </Collapse>
    </Stack>
  );

  return;
}
