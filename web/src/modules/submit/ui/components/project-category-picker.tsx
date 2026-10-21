import { categoryMatchesSearch, categorySuggestions, groupCategories } from "@hubdigital/shared";
import { useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { LayoutGrid, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { RequiredIndicator } from "@/components/required-indicator/required-indicator";
import type { Category, CreateProjectInput } from "../../types/project";
function SelectedCategories({
  ids,
  categories,
  onChange,
}: {
  ids: number[];
  categories: Category[];
  onChange: (ids: number[]) => void;
}) {
  return (
    <ul className="space-y-2">
      {ids.map((id, index) => {
        const name =
          categories.find((category) => category.id === id)?.name ?? "Categoria indisponível";
        return (
          <li
            key={id}
            className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <span className="min-w-0 flex-1">{name}</span>
            {index === 0 ? (
              <span className="text-xs font-medium text-primary">Principal</span>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Tornar ${name} principal`}
                onClick={() => onChange([id, ...ids.filter((value) => value !== id)])}
              >
                Tornar principal
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={`Remover categoria ${name}`}
              onClick={() => onChange(ids.filter((value) => value !== id))}
            >
              <X />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
export function ProjectCategoryPicker({
  form,
  categories,
  disabled,
}: {
  form: UseFormReturn<CreateProjectInput>;
  categories: Category[];
  disabled: boolean;
}) {
  const primary = form.watch("categoryId"),
    secondary = form.watch("secondaryCategoryIds");
  const ids = primary ? [primary, ...secondary] : [];
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [staged, setStaged] = useState<number[]>([]);
  const [dialogSearch, setDialogSearch] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const available = categories.filter(
    (category) => !ids.includes(category.id) && categoryMatchesSearch(category, search),
  );
  const setSelection = (next: number[]) => {
    form.setValue("categoryId", next[0] ?? "", { shouldDirty: true });
    form.setValue("secondaryCategoryIds", next.slice(1), { shouldDirty: true });
    form.clearErrors(["categoryId", "secondaryCategoryIds"]);
  };
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  return (
    <section className="space-y-3" aria-labelledby="project-categories-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="project-categories-title" className="text-sm font-medium">
          Categorias
          <RequiredIndicator />
        </h2>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {ids.length} de 3
        </span>
      </div>
      <p className="text-xs text-muted-foreground">Escolhe uma principal e até duas adicionais.</p>
      <SelectedCategories ids={ids} categories={categories} onChange={setSelection} />
      {ids.length < 3 && (
        <div className="space-y-2">
          <Input
            aria-label="Pesquisar categorias"
            placeholder="Pesquisar categorias…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={disabled}
          />
          <ul className="flex flex-wrap gap-2">
            {categorySuggestions(available, search).map((category) => (
              <li key={category.id}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => {
                    setSelection([...ids, category.id]);
                    setSearch("");
                  }}
                >
                  {category.name}
                </Button>
              </li>
            ))}
          </ul>
          {search && !available.length && (
            <p className="text-xs text-muted-foreground">Nenhuma categoria encontrada.</p>
          )}
        </div>
      )}
      <Button
        ref={trigger}
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => {
          setStaged([...ids]);
          setDialogSearch("");
          setOpen(true);
        }}
      >
        <LayoutGrid className="size-4" aria-hidden="true" />
        Ver todas as categorias
      </Button>
      <Dialog open={open} onClose={close} title="Escolher categorias" className="md:max-w-2xl">
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {staged.length} de 3 · a primeira é a principal
          </p>
          <SelectedCategories ids={staged} categories={categories} onChange={setStaged} />
          <Input
            aria-label="Pesquisar todas as categorias"
            placeholder="Pesquisar categorias…"
            value={dialogSearch}
            onChange={(event) => setDialogSearch(event.target.value)}
          />
          <div className="max-h-[40dvh] space-y-4 overflow-y-auto">
            {groupCategories(
              categories.filter((category) => categoryMatchesSearch(category, dialogSearch)),
            ).map((group) => (
              <section key={group.key} aria-label={group.label}>
                <h3 className="mb-2 text-sm font-semibold">{group.label}</h3>
                <ul className="space-y-1">
                  {group.categories.map((category) => (
                    <li key={category.id}>
                      <label className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent">
                        <input
                          type="checkbox"
                          checked={staged.includes(category.id)}
                          disabled={!staged.includes(category.id) && staged.length >= 3}
                          onChange={(event) =>
                            setStaged(
                              event.target.checked
                                ? [...staged, category.id]
                                : staged.filter((id) => id !== category.id),
                            )
                          }
                        />
                        {category.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                setSelection(staged);
                close();
              }}
            >
              Aplicar categorias
            </Button>
          </div>
        </div>
      </Dialog>
      {form.formState.errors.categoryId?.message && (
        <p role="alert" className="text-xs text-destructive">
          {form.formState.errors.categoryId.message}
        </p>
      )}
      {form.formState.errors.secondaryCategoryIds?.message && (
        <p role="alert" className="text-xs text-destructive">
          {form.formState.errors.secondaryCategoryIds.message}
        </p>
      )}
    </section>
  );
}
