import {
  createTheme,
  darken,
  defaultVariantColorsResolver,
  VariantColorsResolver,
  virtualColor,
} from "@mantine/core";

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
const variantColorResolver: VariantColorsResolver = (input) => {
  const defaultResolvedColors = defaultVariantColorsResolver(input);

  if (input.variant === "danger") {
    return {
      background: "#ef4444",
      hover: darken("#ef4444", 0.2),
      color: "#ffffff",
      border: "none",
    };
  }

  return defaultResolvedColors;
};

export const theme = createTheme({
  variantColorResolver: variantColorResolver,
  defaultRadius: "md",
  white: light.body,
  black: light.text,
  primaryColor: "primary",
  primaryShade: 5,
  defaultGradient: {
    from: "#e05d38",
    to: "yellow",
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
  spacing,
});
