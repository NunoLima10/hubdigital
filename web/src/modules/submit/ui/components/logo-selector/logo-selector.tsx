import { Button, FileButton, Flex, Input, Stack, Text } from "@mantine/core";
import { IconPhotoPlus } from "@tabler/icons-react";
import { useState } from "react";

type LogoSelectorProps = {};

export function LogoSelector({}: LogoSelectorProps) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <Stack gap={"xxs"} align="flex-start">
      <Flex align={"center"} justify={"space-between"} w={"100%"}>
        <Input.Wrapper label="Logo" withAsterisk></Input.Wrapper>
        <Text c={"dimmed"} size="sm">
          Recomendações
        </Text>
      </Flex>
      <FileButton onChange={setFile} accept="image/png,image/jpeg">
        {(props) => (
          <Button {...props} leftSection={<IconPhotoPlus size={18} />}>
            Carregar uma logo
          </Button>
        )}
      </FileButton>
    </Stack>
  );
}
