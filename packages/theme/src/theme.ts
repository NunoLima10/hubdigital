import { createTheme, virtualColor } from "@mantine/core";

export const spacing = {
  none: "0",
  xxxs: "0.25rem",
  xxs: "0.375rem",
  xs: "0.625rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.25rem",
  xl: "2rem",
  xxl: "2.5rem",
  xxxl: "3rem",
} as const;

// Atlântico: Cabo Verde's ocean blue as the brand colour, with the flag's
// sun yellow and red used for the gradient.
const light = {
  body: "#fdfcf9", // warm sand white
  text: "#12233d", // deep navy
  hover: "#eef2f7",
  menuHover: "#e6ecf4",
  disabledBG: "#dde5ef",
  border: "#d5deea",
  inputBorder: "#c9d4e2",
  placeholder: "#5f6f86",
  dimmed: "#5f6f86",
  closeX: "#0a2a5e",
  unknown: "#d92d20",
  notificationTitle: "#12233d",
};

const dark = {
  body: "#0b1a2e", // ocean at night
  bodyDeep: "#07131f",
  text: "#e6edf6",
  hover: "#152a47",
  disabledBG: "#12233b",
  inputBorder: "#2a3c57",
  placeholder: "#8b9bb2",
  dimmed: "#a9b8cc",
  closeX: "#9cc4ff",
  unknown: "#4f8ff0",
};

export const theme = createTheme({
  defaultRadius: "md",
  white: light.body,
  black: light.text,
  primaryColor: "primary",
  primaryShade: 5,
  defaultGradient: {
    from: "#f7c948", // sun
    to: "#e5573f", // coral
    deg: 113,
  },
  colors: {
    primary: virtualColor({
      name: "primary",
      dark: "primarydark",
      light: "primarylight",
    }),
    // dark mode
    dark: [
      dark.text,
      dark.closeX,
      dark.dimmed,
      dark.placeholder,
      dark.inputBorder,
      dark.hover,
      dark.disabledBG,
      dark.body,
      dark.bodyDeep,
      dark.unknown,
    ],

    // light mode
    gray: [
      light.hover,
      light.menuHover,
      light.disabledBG,
      light.border,
      light.inputBorder,
      light.placeholder,
      light.dimmed,
      light.closeX,
      light.unknown,
      light.notificationTitle,
    ],
    primarylight: [
      "#eaf2ff",
      "#d5e5ff",
      "#b0cdff",
      "#86b0f5",
      "#5d92e6",
      "#1f5fbf", // filled
      "#184d9f", // hover
      "#123b7a",
      "#0c2b59",
      "#071c3d",
    ],
    primarydark: [
      "#e6edf6",
      "#6ea6ff", // outline
      "#a9c8ff",
      "#6ea6ff", // light button
      "#6ea6ff", // link
      "#2f6fd6", // filled
      "#2559b0", // hover
      "#1b4488",
      "#123063",
      "#0b1f45",
    ],
  },
  spacing,
});
