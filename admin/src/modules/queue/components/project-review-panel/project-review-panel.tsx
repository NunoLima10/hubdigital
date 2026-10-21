import { projectLinkHref, projectLinkKindLabels } from "@hubdigital/shared";
import { ProjectStatusBadge } from "@/components/status-badge/status-badge";
import { relativeTime } from "@/utils/relative-time";
import {
  countryLabels,
  localConnectionLabels,
  helpWantedLabels,
  formatLocation,
  type AdminProject,
} from "@hubdigital/shared";
import { Anchor, Badge, Card, Divider, Group, Image, Stack, Text, Title } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";

/**
 * Renders a submission the way a visitor would see it. A moderator has to judge
 * what will actually go on the site, so this deliberately shows the banner, the
 * logo and the full description rather than a row of fields.
 */
export function ProjectReviewPanel({ project }: { project: AdminProject }) {
  return (
    <Stack gap="md">
      {project.youtubeVideoId && (
        <div style={{ aspectRatio: "16 / 9" }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${project.youtubeVideoId}`}
            title={`Trailer de ${project.name}`}
            style={{
              width: "100%",
              height: "100%",
              border: 0,
              borderRadius: "var(--mantine-radius-md)",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}

      {project.galleryImageUrls.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "var(--mantine-spacing-xs)",
          }}
        >
          {project.galleryImageUrls.map((url, index) => (
            <Image
              key={url}
              src={url}
              alt={`${project.name}, imagem ${index + 1}`}
              style={{ aspectRatio: "16 / 9" }}
              fit="cover"
              radius="md"
            />
          ))}
        </div>
      )}

      <Group gap="md" wrap="nowrap" align="flex-start">
        {project.logoUrl && <Image src={project.logoUrl} alt="" w={56} h={56} radius="md" />}
        <Stack gap={4}>
          <Group gap="xs">
            <Title order={4}>{project.name}</Title>
            <ProjectStatusBadge status={project.status} />
          </Group>
          <Text size="sm" c="dimmed">
            {project.shortDescription}
          </Text>
          {project.links.map((link) => {
            const href = projectLinkHref(link);
            return href ? (
              <Anchor key={link.id} href={href} target="_blank" rel="noopener noreferrer" size="sm">
                {link.isPrimary ? "Principal: " : ""}
                {link.label || projectLinkKindLabels[link.kind]} <IconExternalLink size={14} />
              </Anchor>
            ) : (
              <Text key={link.id} size="xs" c="dimmed">
                Destino por completar
              </Text>
            );
          })}
        </Stack>
      </Group>

      <Group gap="xs">
        {project.category && <Badge variant="light">{project.category.name} · Principal</Badge>}
        {project.secondaryCategories.map((category) => (
          <Badge key={category.id} variant="outline">
            {category.name}
          </Badge>
        ))}
        {project.location && <Badge variant="outline">{formatLocation(project.location)}</Badge>}
      </Group>

      <Stack gap="xs">
        {project.languages.length > 0 && (
          <Text size="sm">Línguas: {project.languages.join(", ")}</Text>
        )}
        {project.teamDescription && <Text size="sm">Equipa: {project.teamDescription}</Text>}
        {project.helpWanted.length > 0 && (
          <Text size="sm">
            Procura ajuda: {project.helpWanted.map((value) => helpWantedLabels[value]).join(", ")}
          </Text>
        )}
        {project.helpDescription && <Text size="sm">{project.helpDescription}</Text>}
        {project.additionalLocations.map((location, index) => (
          <Text key={index} size="sm">
            Outra base: {formatLocation(location)}
          </Text>
        ))}
        {project.teamMode === "distributed" && <Text size="sm">Equipa distribuída</Text>}
        {project.serviceArea && (
          <Text size="sm">
            Pode ser usado:{" "}
            {project.serviceArea.scope === "worldwide"
              ? "Em todo o mundo"
              : project.serviceArea.countries.map((code) => countryLabels[code]).join(", ")}
          </Text>
        )}
        {project.localConnections.length > 0 && (
          <Text size="sm">
            Ligação a Cabo Verde:{" "}
            {project.localConnections.map((code) => localConnectionLabels[code]).join(", ")}
          </Text>
        )}
        {[project.location, ...project.additionalLocations].map(
          (location, index) =>
            location?.publicPin && (
              <Text key={index} size="xs" c="dimmed">
                {formatLocation(location)}: {location.publicPin.latitude},{" "}
                {location.publicPin.longitude} (
                {location.publicPin.precision === "exact" ? "local público exato" : "aproximado"})
              </Text>
            ),
        )}
      </Stack>

      {project.description && (
        <>
          <Divider label="Descrição" labelPosition="left" />
          {/* The maker writes this in a rich-text editor, so it arrives as HTML. */}
          <Card withBorder padding="sm">
            <div
              dangerouslySetInnerHTML={{ __html: project.description }}
              style={{ fontSize: "var(--mantine-font-size-sm)" }}
            />
          </Card>
        </>
      )}

      <Divider label="Autor" labelPosition="left" />

      <Stack gap={2}>
        <Text size="sm">
          {project.publisher?.user.name ?? "—"}{" "}
          <Text span c="dimmed" size="sm">
            · {project.publisher?.user.email}
          </Text>
        </Text>
        <Text size="xs" c="dimmed">
          {project.publisher?.bio}
        </Text>
      </Stack>

      <Group gap="lg">
        <Text size="xs" c="dimmed">
          Submetido {relativeTime(project.createdAt)}
        </Text>
        {project.queuedAt && (
          <Text size="xs" c="dimmed">
            Na fila desde {relativeTime(project.queuedAt)}
          </Text>
        )}
      </Group>
    </Stack>
  );
}
