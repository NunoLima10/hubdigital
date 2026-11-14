import { Card, Flex, Group, Image, Stack, Text, Title } from "@mantine/core";
import type { PropsWithChildren, ReactNode } from "react";
import classes from "./auth-card.module.css";

type AuthCardProps = PropsWithChildren & {
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  /** Rendered next to the title — used here for the ADMIN badge. */
  badge?: ReactNode;
};

export function AuthCard({
  title,
  subtitle,
  imageSrc,
  badge,
  children,
}: AuthCardProps) {
  const rootClass = imageSrc ? classes.root : classes.rootWithoutImage;
  const contentClass = imageSrc
    ? classes.contend
    : classes.contendWithoutImage;

  return (
    <Stack className={rootClass}>
      <Card className={classes.card} withBorder>
        <Stack className={contentClass}>
          <Stack gap="none" align="center">
            <Group gap="xs" justify="center">
              <Title order={3}>{title}</Title>
              {badge}
            </Group>
            <Text c="dimmed" size="sm">
              {subtitle}
            </Text>
          </Stack>
          {children}
        </Stack>
        {imageSrc && (
          <Flex className={classes.image} visibleFrom="md">
            <Image src={imageSrc} />
          </Flex>
        )}
      </Card>
    </Stack>
  );
}
