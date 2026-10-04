import { Button } from "@/components/ui/button";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { makerProfileUpdateSchema } from "@hubdigital/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { useMaker, useMyHandle, useUpdateMaker } from "../../hooks/use-maker";

type Values = {
  handle: string;
  bio: string;
  websiteUrl: string;
  githubUrl: string;
  linkedinUrl: string;
};
const empty: Values = {
  handle: "",
  bio: "",
  websiteUrl: "",
  githubUrl: "",
  linkedinUrl: "",
};
export function ProfileForm() {
  const { data: handle, isLoading: loadingHandle } = useMyHandle();
  const { data: profile, isLoading: loadingProfile } = useMaker(
    handle ?? undefined,
  );
  const isLoading = loadingHandle || loadingProfile;
  const showLoading = useDelayedLoading(isLoading);
  const form = useForm<Values>({
    defaultValues: empty,
    resolver: zodResolver(makerProfileUpdateSchema) as Resolver<Values>,
  });
  const { reset } = form;
  useEffect(() => {
    if (profile)
      reset({
        handle: profile.handle ?? "",
        bio: profile.bio,
        websiteUrl: profile.websiteUrl ?? "",
        githubUrl: profile.githubUrl ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
      });
  }, [profile, reset]);
  const { updateMaker, isPending } = useUpdateMaker();
  if (isLoading)
    return showLoading ? (
      <div className="space-y-3">
        <div className="h-9 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded bg-muted" />
      </div>
    ) : null;
  if (!handle)
    return (
      <p className="text-sm text-muted-foreground">
        Conclui o teu perfil de publicador para poderes editá-lo.
      </p>
    );
  const fields = [
    ["handle", "Nome de utilizador", "o-teu-nome"],
    ["websiteUrl", "Website", "https://exemplo.cv"],
    ["githubUrl", "GitHub", "https://github.com/utilizador"],
    ["linkedinUrl", "LinkedIn", "https://linkedin.com/in/utilizador"],
  ] as const;
  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-baseline gap-3">
        <h1 className="text-xl font-semibold">Perfil público</h1>
        {profile?.handle && (
          <Link
            to="/makers/$handle"
            params={{ handle: profile.handle }}
            className="text-sm text-primary hover:underline"
          >
            ver perfil
          </Link>
        )}
      </div>
      <form
        onSubmit={form.handleSubmit((values) => updateMaker(values))}
        className="space-y-4"
      >
        {fields.slice(0, 1).map(([name, label, placeholder]) => (
          <label key={name} className="block space-y-1.5 text-sm font-medium">
            {label}
            <Input placeholder={placeholder} {...form.register(name)} />
            {form.formState.errors[name]?.message && (
              <span className="text-xs text-destructive">
                {form.formState.errors[name]?.message}
              </span>
            )}
            <span className="block text-xs font-normal text-muted-foreground">
              Endereço do perfil: /makers/o-teu-nome
            </span>
          </label>
        ))}
        <label className="block space-y-1.5 text-sm font-medium">
          Bio
          <Textarea rows={3} {...form.register("bio")} />
          {form.formState.errors.bio?.message && (
            <span className="text-xs text-destructive">
              {form.formState.errors.bio.message}
            </span>
          )}
        </label>
        {fields.slice(1).map(([name, label, placeholder]) => (
          <label key={name} className="block space-y-1.5 text-sm font-medium">
            {label}
            <Input
              type="url"
              placeholder={placeholder}
              {...form.register(name)}
            />
            {form.formState.errors[name]?.message && (
              <span className="text-xs text-destructive">
                {form.formState.errors[name]?.message}
              </span>
            )}
          </label>
        ))}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "A guardar..." : "Guardar perfil"}
          </Button>
        </div>
      </form>
    </div>
  );
}
