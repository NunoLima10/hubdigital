import { Header } from "@/components/header/header";
import { Page } from "@/layouts/page";
import { ProjectList } from "@/modules/project-list";
import { AnnouncementBanner } from "@/modules/settings/components/announcement-banner/announcement-banner";
import {
  ProjectFilters,
  type ProjectFilterValues,
} from "@/modules/project-list/components/project-filters/project-filters";
import {
  islandValues,
  listPeriodValues,
  pricingValues,
  type ListPeriod,
} from "@hubdigital/shared";
import { Container, Stack, Tabs, Text, Title } from "@mantine/core";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

// Every field is optional so that navigating to "/" from anywhere else does not
// have to supply search params.
type HomeSearch = ProjectFilterValues & { period?: ListPeriod };

export const Route = createFileRoute("/")({
  /**
   * Filters live in the URL so a filtered view survives a reload and can be
   * shared. Anything unrecognised is dropped rather than passed to the API.
   */
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const period = listPeriodValues.includes(search.period as ListPeriod)
      ? (search.period as ListPeriod)
      : "this_week";

    const island = islandValues.includes(search.island as never)
      ? (search.island as HomeSearch["island"])
      : undefined;

    const pricing = pricingValues.includes(search.pricing as never)
      ? (search.pricing as HomeSearch["pricing"])
      : undefined;

    const categoryId = Number(search.categoryId);
    const q = typeof search.q === "string" ? search.q.trim() : "";

    return {
      // Left out when it is the default, so the common URL stays clean.
      period: period === "this_week" ? undefined : period,
      island,
      pricing,
      categoryId:
        Number.isFinite(categoryId) && categoryId > 0 ? categoryId : undefined,
      q: q || undefined,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { period = "this_week", ...filters } = search;

  /**
   * Replaces the filter half of the search wholesale rather than merging, so
   * clearing a filter actually drops it from the URL. ProjectFilters always
   * hands back the complete set it wants applied.
   */
  function setFilters(next: ProjectFilterValues) {
    navigate({ search: { ...next, period } });
  }

  function setPeriod(next: ListPeriod) {
    navigate({ search: (current) => ({ ...current, period: next }) });
  }

  return (
    <Page banner={<AnnouncementBanner />}>
      <Header />
      <Stack mt={100}>
        <Title ta={"center"} order={1}>
          HubDigital Cabo Verde
        </Title>
        <Container p={0} size={600}>
          <Text ta={"center"} size="md" c="dimmed">
            Um Hub digital de código aberto para impulsionar a inovação em Cabo
            Verde, meio para descobrir, partilhar e apoiar projetos e produtos
            criados por caboverdianos para caboverdianos.
          </Text>
        </Container>

        <ProjectFilters
          value={filters}
          onChange={setFilters}
        />

        <Tabs
          value={period}
          onChange={(value) => setPeriod((value as ListPeriod) ?? "this_week")}
        >
          <Tabs.List mb="xl">
            <Tabs.Tab value="this_week">Esta semana</Tabs.Tab>
            <Tabs.Tab value="last_week">Semana passada</Tabs.Tab>
            <Tabs.Tab value="all">Todos</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <ProjectList period={period} filters={filters} />
      </Stack>
    </Page>
  );
}
