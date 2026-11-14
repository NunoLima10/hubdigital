import {
  ActionIcon,
  Group,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import classes from "./toggle-sheme-button.module.css";

export function ToggleShemeButton() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  return (
    <Group justify="center">
      <ActionIcon
        onClick={() =>
          setColorScheme(computedColorScheme === "light" ? "dark" : "light")
        }
        variant="default"
        size="input-sm"
        aria-label="Alternar esquema de cores"
      >
        <IconSun className={classes.light} stroke={1.5} />
        <IconMoon className={classes.dark} stroke={1.5} />
      </ActionIcon>
    </Group>
  );
}
