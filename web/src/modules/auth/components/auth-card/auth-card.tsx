import { Card, Flex, Image, Stack, Text, Title } from "@mantine/core";
import type { PropsWithChildren } from "react";
import classes from "./auth-card.module.css";

type AuthCardProps = PropsWithChildren & {
  title?: string;
  subtitle?: string;
  imageSrc?: string;
};

export function AuthCard({
  title,
  subtitle,
  imageSrc,
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
            <Title order={3}>{title}</Title>
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
