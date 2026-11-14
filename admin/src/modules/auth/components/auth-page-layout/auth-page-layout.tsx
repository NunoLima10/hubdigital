import { Stack, type StackProps } from "@mantine/core";
import type { PropsWithChildren } from "react";

export function AuthPageLayout({ children }: PropsWithChildren) {
  return <Stack {...centerStackProps}>{children}</Stack>;
}

const centerStackProps: StackProps = {
  w: "100%",
  mih: "100dvh",
  px: "sm",
  pt: {
    base: "md",
    md: 0,
  },
  pb: {
    base: "md",
    md: 0,
  },
  align: "center",
  justify: "center",
};
