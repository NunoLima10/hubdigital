import { spacing } from "@app/theme";
import { ButtonVariant } from "@mantine/core";

type ExtendedButtonVariant = ButtonVariant | "danger";

declare module "@mantine/core" {
  export interface MantineThemeSizesOverride {
    spacing: typeof spacing;
  }
  export interface ButtonProps {
    variant?: ExtendedButtonVariant;
  }
}
