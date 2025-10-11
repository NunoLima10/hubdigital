import { SimpleGrid } from "@mantine/core";
import { ReleasesItem } from "../releases-item/releases-item";

type ReleasesListProps = {};

export function ReleasesList({}: ReleasesListProps) {
  return (
    <SimpleGrid cols={{ base: 1, xl: 2 }} w={"100%"} h={"100%"} spacing={"xs"}>
      <ReleasesItem />
      <ReleasesItem />
      <ReleasesItem />
      <ReleasesItem />
    </SimpleGrid>
  );
}
