import { Anchor, Stack, Text } from "@mantine/core";
import classes from "./footer.module.css";

export function Footer() {
  return (
    <footer className={classes.footer}>
      <Stack align="center" gap={0}>
        <Text size="sm">Servindo Cabo Verde</Text>
        <Text size="sm">
          Fundado por <Anchor href="https://nunolima.cv/" target="_blank">Nuno Lima</Anchor> em 11 Abril 2025
        </Text>
      </Stack>
    </footer>
  );
}
