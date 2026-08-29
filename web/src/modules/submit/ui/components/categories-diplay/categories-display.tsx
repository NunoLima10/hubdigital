import { Badge, Flex, Stack, Text } from "@mantine/core";

type CategoriesDisplayProps = {
  label: string;
  badges: string[];
};

export function CategoriesDisplay({ label, badges }: CategoriesDisplayProps) {
  return (
    <Stack gap={"xxs"}>
      <Text fw={600}>{label}</Text>
      <Flex gap={"xs"}>
        {badges.map((badge) => (
          <Badge key={badge} variant="default">
            {badge}
          </Badge>
        ))}
      </Flex>
    </Stack>
  );
}
