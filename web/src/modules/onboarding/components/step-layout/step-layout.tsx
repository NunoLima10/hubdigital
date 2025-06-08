import { Stack, Text } from "@mantine/core";
import { PropsWithChildren } from "react";

type StepLayout = PropsWithChildren & {
  title: string;
};

export function StepLayout({ children, title }: StepLayout) {
  return (
    <Stack mih={400} p={"md"}>
      <Text ta={"center"} fw={500} fz={"h2"}>
        {title}
      </Text>
      <Stack />
      {children}
    </Stack>
  );
}
