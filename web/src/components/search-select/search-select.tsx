import { Combobox } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SearchSelectOption = { value: string; label: string; icon?: ReactNode };

/** A fixed-width slot, so names line up whether the icon is a flag or an outline. */
function OptionIcon({ icon }: { icon?: ReactNode }) {
  return icon ? <span className="flex w-5 shrink-0 items-center justify-center">{icon}</span> : null;
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * A select with a search box on top: typing narrows the options, accents
 * ignored ("sao" finds "São Vicente"). Looks like the plain form select.
 */
export function SearchSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  onValueChange,
  label,
  className,
}: {
  value: string;
  options: readonly SearchSelectOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
}) {
  const byValue = new Map(options.map((option) => [option.value, option]));
  const selected = byValue.get(value);
  const labelOf = (item: string) => byValue.get(item)?.label ?? "";

  return (
    <Combobox.Root
      items={options.map((option) => option.value)}
      value={selected ? value : null}
      onValueChange={(next) => onValueChange((next as string | null) ?? "")}
      itemToStringLabel={labelOf}
      filter={(item: string, query) => normalize(labelOf(item)).includes(normalize(query.trim()))}
      autoHighlight
    >
      <Combobox.Trigger
        aria-label={label}
        className={cn(
          "group flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm transition-colors outline-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-popup-open:border-ring dark:hover:bg-input/50",
          className,
        )}
      >
        <OptionIcon icon={selected?.icon} />
        <span className={cn("flex-1 truncate", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-popup-open:rotate-180" />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} align="start" className="isolate z-[1250]">
          <Combobox.Popup className="flex max-h-[min(20rem,var(--available-height))] w-(--anchor-width) min-w-[min(18rem,var(--available-width))] origin-(--transform-origin) flex-col overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-lg ring-1 ring-border duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <div className="flex items-center gap-2 border-b px-3">
              <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
              <Combobox.Input
                placeholder={searchPlaceholder}
                className="h-10 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
              />
            </div>
            <Combobox.Empty className="px-3 py-5 text-center text-sm text-muted-foreground empty:hidden">
              {emptyText}
            </Combobox.Empty>
            <Combobox.List className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 empty:hidden">
              {(item: string) => (
                <Combobox.Item
                  key={item}
                  value={item}
                  className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <OptionIcon icon={byValue.get(item)?.icon} />
                  <span className="flex-1 truncate">{labelOf(item)}</span>
                  <Combobox.ItemIndicator>
                    <CheckIcon className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
