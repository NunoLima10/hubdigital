import { createTheme, Input, mergeThemeOverrides } from "@mantine/core";
import { theme as sharedTheme } from "@hubdigital/theme";
import inputClasses from "./input.module.css";

export const theme = mergeThemeOverrides(
  sharedTheme,
  createTheme({
    components: {
      Input: Input.extend({
        classNames: { input: inputClasses.input },
      }),
    },
  }),
);
