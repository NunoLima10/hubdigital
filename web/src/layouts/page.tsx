import { Flex, Stack } from "@mantine/core";
import React from "react";
import classes from "./page.module.css";

type PageProps = {
  children: React.ReactNode;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  banner?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
};

export function Page({
  children,
  leftSection,
  rightSection,
  banner,
  header,
  footer,
}: PageProps) {
  return (
    <Stack gap={0}>
      {banner}
      {header && <Stack className={classes.container}>{header}</Stack>}

      <Flex className={classes.container}>
        {leftSection && (
          <Stack className={classes.leftSection}>{leftSection}</Stack>
        )}
        <Stack className={classes.center}>{children}</Stack>
        {rightSection && (
          <Stack className={classes.rightSection}>{rightSection}</Stack>
        )}
      </Flex>
      {footer && <Stack className={classes.container}>{footer}</Stack>}
    </Stack>
  );
}
