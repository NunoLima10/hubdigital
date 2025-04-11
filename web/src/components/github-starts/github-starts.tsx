import { ActionIcon, Anchor, Flex, Text } from "@mantine/core";
import { IconBrandGithub } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import classes from "./github-starts.module.css";

async function getGithubStars() {
  const response = await fetch(
    "https://api.github.com/repos/NunoLima10/hubdigital"
  );

  const data = await response.json();

  return data?.stargazers_count as number;
}
export function GithubStars() {
  const { data: starts, isLoading } = useQuery({
    queryFn: getGithubStars,
    queryKey: ["githubStars"],
  });

  return (
    <Anchor href="https://github.com/NunoLima10/hubdigital" target="_blank">
      <ActionIcon
        variant="default"
        size="input-sm"
        aria-label="Alternar esquema de cores"
        classNames={{
          root: classes.root,
        }}
        loading={isLoading}
        loaderProps={{ type: "dots" }}
      >
        <Flex align={"center"} gap={2}>
          <IconBrandGithub size={18} />
          <Text>{starts}</Text>
        </Flex>
      </ActionIcon>
    </Anchor>
  );
}
