import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormSelectOption = { value: string; label: string };

export function FormSelect({
  value,
  options,
  placeholder,
  onValueChange,
  disabled = false,
  invalid = false,
}: {
  value: string;
  options: readonly FormSelectOption[];
  placeholder: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <Select
      items={options}
      value={value || null}
      onValueChange={(nextValue) => onValueChange(nextValue ?? "")}
      disabled={disabled}
    >
      <SelectTrigger
        className="w-full rounded-md bg-background"
        aria-invalid={invalid || undefined}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        className="max-h-64 rounded-lg p-1 shadow-lg ring-1 ring-border"
      >
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="rounded-md">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
