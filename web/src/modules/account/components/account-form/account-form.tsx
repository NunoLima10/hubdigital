import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { allowedUploadContentTypes, maxUploadBytes } from "@hubdigital/shared";
import { Camera, Trash2, UserRound } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAvatar, useUpdateName } from "../../hooks/use-account";

const MAX_NAME_LENGTH = 80;

function AvatarField() {
  const { data: session } = authClient.useSession();
  const { change, remove, percentage, isPending } = useAvatar();
  const input = useRef<HTMLInputElement>(null);
  const image = session?.user.image;

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!(allowedUploadContentTypes as readonly string[]).includes(file.type)) {
      toast.error("Escolhe uma imagem PNG, JPG ou WebP.");
      return;
    }
    if (file.size > maxUploadBytes) {
      toast.error("A imagem tem de ter até 5 MB.");
      return;
    }
    try {
      await change(file);
      toast.success("Foto atualizada");
    } catch {
      toast.error("Não foi possível atualizar a foto. Tenta de novo.");
    }
  }

  async function onRemove() {
    try {
      await remove();
      toast.success("Foto removida");
    } catch {
      toast.error("Não foi possível remover a foto.");
    }
  }

  return (
    <div className="flex items-center gap-4">
      <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-muted-foreground">
        {image ? (
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          <UserRound className="size-6" />
        )}
      </span>
      <div className="flex flex-wrap gap-2">
        <input
          ref={input}
          type="file"
          accept={allowedUploadContentTypes.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            void onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => input.current?.click()}
        >
          <Camera />
          {percentage !== undefined ? `A carregar ${percentage}%` : image ? "Mudar foto" : "Adicionar foto"}
        </Button>
        {image && (
          <Button type="button" variant="ghost" disabled={isPending} onClick={onRemove}>
            <Trash2 />
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}

function NameField() {
  const { data: session } = authClient.useSession();
  const { updateName, isPending } = useUpdateName();
  const current = session?.user.name ?? "";
  const [name, setName] = useState(current);
  useEffect(() => setName(current), [current]);
  const trimmed = name.trim();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!trimmed) return;
    try {
      await updateName(trimmed);
      toast.success("Nome atualizado");
    } catch {
      toast.error("Não foi possível guardar o nome.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="block flex-1 space-y-1.5 text-sm font-medium">
        Nome
        <Input
          value={name}
          maxLength={MAX_NAME_LENGTH}
          required
          autoComplete="name"
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <Button type="submit" disabled={isPending || !trimmed || trimmed === current}>
        {isPending ? "A guardar..." : "Guardar nome"}
      </Button>
    </form>
  );
}

/** Photo and display name: what the header, comments and maker page show. */
export function AccountForm() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold">Conta</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A tua foto e o teu nome aparecem nos comentários e no teu perfil público.
        </p>
      </div>
      <AvatarField />
      <NameField />
    </div>
  );
}
