import { Group, Radio, Text } from "@mantine/core";
import classes from "./radio-card.module.css";
type RadioCardProbs = {
  value: string;
  label: string;
};

export function RadioCard({ value, label }: RadioCardProbs) {
  return (
    <Radio.Card className={classes.root} value={value}>
      <Group wrap="nowrap" align="flex-start">
        <Radio.Indicator />
        <Text className={classes.label}>{label}</Text>
      </Group>
    </Radio.Card>
  );
}
