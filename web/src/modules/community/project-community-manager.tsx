import { authClient } from "@/lib/auth-client";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { FormSelect } from "@/modules/submit/ui/components/form-select/form-select";
import {
  announcementKindLabels,
  type Announcement,
  type MakerMembership,
  type Project,
} from "@hubdigital/shared";
import { toast } from "sonner";
export function ProjectCommunityManager({ project }: { project: Project }) {
  const { data: session } = authClient.useSession();
  const viewer = session?.user.id ?? null;
  const [open, setOpen] = useState(false),
    [kind, setKind] = useState<Announcement["kind"]>("presentation"),
    [introduction, setIntroduction] = useState(""),
    [handle, setHandle] = useState("");
  const key = useRef(crypto.randomUUID());
  const cache = useQueryClient();
  const { data: announcements = [] } = useQuery({
    queryKey: ["my-announcements", project.id, viewer],
    enabled: open,
    queryFn: async () =>
      (await API.get<{ data: Announcement[] }>(`/projects/${project.id}/announcements/mine`)).data
        .data,
  });
  const { data: makers = [] } = useQuery({
    queryKey: ["project-makers", project.id, viewer],
    enabled: open,
    queryFn: async () =>
      (await API.get<{ data: MakerMembership[] }>(`/projects/${project.id}/makers`)).data.data,
  });
  const { data: me } = useQuery({
    queryKey: ["maker-self", viewer],
    enabled: open,
    queryFn: async () => (await API.get<{ data: { handle: string } }>("/makers/me")).data.data,
  });
  const create = useMutation({
    mutationFn: async () =>
      await API.post<{
        data: { status: string; kind: Announcement["kind"]; introduction: string };
      }>(`/projects/${project.id}/announcements`, {
        kind,
        introduction,
        creationKey: key.current,
      }),
    onSuccess: (response) => {
      key.current = crypto.randomUUID();
      const changed =
        response.data.data.introduction !== introduction.trim() || response.data.data.kind !== kind;
      if (!changed) setIntroduction("");
      cache.invalidateQueries({ queryKey: ["my-announcements", project.id] });
      cache.invalidateQueries({ queryKey: ["announcements"] });
      if (changed) {
        toast.info(
          "O anúncio já foi enviado com a mensagem anterior. A mensagem atual continua aqui por enviar.",
        );
        return;
      }
      toast.success(
        response.data.data.status === "pending"
          ? "Anúncio enviado para revisão. A semana será confirmada na aprovação."
          : "Anúncio publicado nesta semana (Cabo Verde).",
      );
    },
    onError: (error) =>
      toast.error(
        (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
          ?.message ?? "Não foi possível publicar o anúncio. Podes tentar novamente.",
      ),
  });
  const invite = useMutation({
    mutationFn: async (target: string) =>
      await API.post(`/projects/${project.id}/makers`, { handle: target.trim().replace(/^@/, "") }),
    onSuccess: () => {
      setHandle("");
      cache.invalidateQueries({ queryKey: ["project-makers", project.id] });
      toast.success("Participação registada. Outros criadores precisam de aceitar o convite.");
    },
    onError: () => toast.error("Não foi possível adicionar este perfil. Confirma o nome público."),
  });
  return (
    <div className="mt-3">
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Comunidade
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Comunidade: ${project.name}`}>
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Apresentar à comunidade</h2>
            <p className="text-xs text-muted-foreground">
              A página do projeto já está pública. Um anúncio é uma apresentação ou novidade
              separada, com votos e uma semana próprios.
            </p>
            <label className="block space-y-1 text-sm">
              Tipo de anúncio
              <FormSelect
                value={kind}
                options={Object.entries(announcementKindLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
                placeholder="Escolher tipo"
                disabled={create.isPending}
                onValueChange={(value) => setKind(value as Announcement["kind"])}
              />
            </label>
            <label className="block space-y-1 text-sm">
              {kind === "major_update" ? "O que há de novo?" : "Apresenta o projeto"}
              <Textarea
                aria-label="Mensagem do anúncio"
                maxLength={1000}
                disabled={create.isPending}
                value={introduction}
                onChange={(event) => setIntroduction(event.target.value)}
              />
            </label>
            <p className="text-right text-xs text-muted-foreground">
              {introduction.length}/1000 · mínimo 10 caracteres
            </p>
            <Button
              type="button"
              disabled={introduction.trim().length < 10 || create.isPending}
              onClick={() => create.mutate()}
            >
              Publicar anúncio
            </Button>
            <ul className="space-y-2">
              {announcements.map((announcement) => (
                <li key={announcement.id} className="rounded-md border p-3 text-sm">
                  <p>
                    {announcementKindLabels[announcement.kind]} ·{" "}
                    {announcement.status === "pending"
                      ? "Em revisão"
                      : announcement.status === "rejected"
                        ? "Rejeitado"
                        : "Publicado"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{announcement.introduction}</p>
                  {announcement.week && (
                    <p className="text-xs text-muted-foreground">
                      {announcement.week} · Cabo Verde
                    </p>
                  )}
                  {announcement.rejectionReason && (
                    <p className="text-xs text-destructive">{announcement.rejectionReason}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Criadores</h2>
            <p className="text-xs text-muted-foreground">
              Só aparecem publicamente depois de aceitarem. Publicar o projeto não atribui autoria
              automaticamente.
            </p>
            <ul className="space-y-2">
              {makers.map((maker) => (
                <li key={maker.id} className="text-sm">
                  {maker.name} · {maker.status === "accepted" ? "Confirmado" : "Convite pendente"}
                </li>
              ))}
            </ul>
            {me?.handle && !makers.some((maker) => maker.handle === me.handle) && (
              <Button
                type="button"
                variant="outline"
                disabled={invite.isPending}
                onClick={() => invite.mutate(me.handle)}
              >
                Adicionar-me como criador
              </Button>
            )}
            <label className="block space-y-1 text-sm">
              Perfil de outro criador
              <Input
                value={handle}
                placeholder="@nome"
                maxLength={80}
                onChange={(event) => setHandle(event.target.value)}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              disabled={!handle.trim() || invite.isPending}
              onClick={() => invite.mutate(handle)}
            >
              Convidar criador
            </Button>
          </section>
        </div>
      </Dialog>
    </div>
  );
}
