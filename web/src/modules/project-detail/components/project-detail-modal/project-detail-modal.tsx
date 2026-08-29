import { ProjectMinimal } from "@/modules/submit/types/project";
import { ActionIcon, Group, Modal, Skeleton, Stack, Text } from "@mantine/core";
import {
  IconArrowsMaximize,
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useProject } from "../../hooks/use-project";
import { ProjectDetailView } from "../project-detail-view/project-detail-view";
import classes from "./project-detail-modal.module.css";

type ProjectDetailModalProps = {
  projects: ProjectMinimal[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

export function ProjectDetailModal({
  projects,
  index,
  onIndexChange,
  onClose,
}: ProjectDetailModalProps) {
  const current = index !== null ? projects[index] : undefined;

  return (
    <Modal
      opened={!!current}
      onClose={onClose}
      size="70rem"
      padding={0}
      withCloseButton={false}
      radius="md"
      centered
    >
      {current && index !== null && (
        <ProjectDetailModalContent
          slug={current.slug}
          hasPrev={index > 0}
          hasNext={index < projects.length - 1}
          onPrev={() => onIndexChange(index - 1)}
          onNext={() => onIndexChange(index + 1)}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

type ProjectDetailModalContentProps = {
  slug: string;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
};

function ProjectDetailModalContent({
  slug,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
}: ProjectDetailModalContentProps) {
  const { data, isLoading, isError } = useProject(slug);
  const navigate = useNavigate();

  function handleExpand() {
    onClose();
    navigate({ to: "/projects/$slug", params: { slug } });
  }

  return (
    <Stack gap={0}>
      <Group
        justify="space-between"
        className={classes.toolbar}
        px="md"
        py="sm"
      >
        <Group gap={4}>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={handleExpand}
            aria-label="Expandir projeto"
          >
            <IconArrowsMaximize size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Projeto anterior"
          >
            <IconChevronLeft size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Próximo projeto"
          >
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={onClose}
          aria-label="Fechar"
        >
          <IconX size={18} />
        </ActionIcon>
      </Group>

      <Stack className={classes.body} px="xl" pb="xl" pt="md">
        {isLoading && (
          <Stack gap="lg">
            <Skeleton h={28} w={220} />
            <Skeleton h={220} radius="md" />
          </Stack>
        )}
        {isError && (
          <Text c="dimmed">Não foi possível carregar este projeto.</Text>
        )}
        {data && <ProjectDetailView project={data} />}
      </Stack>
    </Stack>
  );
}
