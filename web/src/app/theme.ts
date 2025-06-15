import { createTheme, darken, lighten, virtualColor } from "@mantine/core";

const light = {
  body: "#e8ebed",
  text: "#333333",
  hover: "#f3f4f6",
  menuHover: "#f3f4f6",
  disabledBG: "#dcdfe2",
  border: darken("#e5e5e5", 0.05), //skelont
  inputBoder: "#dcdfe2",
  placeholder: "#6b7280", // disabled-text
  dimmed: "#979ca6",
  closeX: "#1e3a8a",
  unknown: "red",
  notifictionTitle: "#333333",
};
const lightPrimary = {
  filled: "#e05d38", //outline
  hover: darken("#e05d38", 0.1),
};

const dark = {
  body: "#1c2433",
  text: "#e5e5e5",
  hover: "#2a303e",
  menuHover: "#6a6e78",
  disabledBG: "#2a303e",
  border: "#3d4354", //skelont
  inputBoder: "#3d4354",
  placeholder: "#a3a3a3", // disabled-text
  dimmed: "#bfbfbf",
  closeX: "#bfdbfe",
  unknown: "red",
  notifictionTitle: "#e5e5e5",
};

const darkPrimary = {
  filled: "#e05d38",
  hover: "#be4f30",
  text: "#e5e5e5",
  buttonOuntline: "#e05d38",
  lightButton: "#e05d38", 
  link: "#e05d38",
};

export const theme = createTheme({
  defaultRadius: "0.5rem",
  white: light.body,
  black: light.text,
  primaryColor: "primary",
  primaryShade: 5,
  defaultGradient: {
    from: "#d6e4f0",
    to: "#2a3656",
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
      dark.inputBoder,
      dark.hover,
      dark.disabledBG,
      dark.body,
      darken(dark.body, 0.2),
      "blue",
    ],

    // light mode
    gray: [
      light.hover,
      light.menuHover,
      light.disabledBG,
      light.border,
      light.inputBoder,
      light.placeholder,
      light.dimmed,
      light.closeX,
      light.unknown,
      light.notifictionTitle,
    ],
    primarylight: [
      "green",
      "green",
      "green",
      "green",
      "green",
      lightPrimary.filled,
      lightPrimary.hover,
      "green",
      "green",
      "green",
    ],
    primarydark: [
      darkPrimary.text,
      darkPrimary.buttonOuntline,
      "yellow",
      darkPrimary.lightButton,
      darkPrimary.link,
      darkPrimary.filled,
      darkPrimary.hover,
      "yellow",
      "yellow",
      "yellow",
    ],
  },
});
