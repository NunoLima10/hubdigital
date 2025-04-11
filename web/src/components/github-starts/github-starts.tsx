import { ActionIcon, Anchor, Flex, Text } from "@mantine/core";
import { IconBrandGithub } from "@tabler/icons-react";
import classes from "./github-starts.module.css";

export function GithubStars() {
  return (
    <Anchor>
      <ActionIcon
        variant="default"
        size="input-sm"
        aria-label="Alternar esquema de cores"
        classNames={{
          root: classes.root,
        }}
        loading
        loaderProps={{ type: "dots" }}
      >
        <Flex align={"center"} gap={2}>
          <IconBrandGithub size={18} />
          <Text>0</Text>
        </Flex>
      </ActionIcon>
    </Anchor>
  );
}
