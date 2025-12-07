import { SimpleGrid, Skeleton, Stack, Text } from "@mantine/core";
import { CategoriesDisplay } from "../../components/categories-diplay/categories-display";
import { ProjectCard } from "../../components/project-card/project-card";

type ProjectReviewProps = {};

export function ProjectReview({}: ProjectReviewProps) {
  return (
    <Stack>
      <Skeleton h={250} w={"100%"} animate={false}></Skeleton>
      <ProjectCard
        name="Nome do projeto"
        description="Este texto tem 50 caracteres do ipsa. Lorem ipsum dolor sit"
        websiteUrl="https://hubdigital.cv/"
        iconUrl="https://notifika.cv/assets/Icon3D-CREwZX7D.webp"
      />
      <SimpleGrid cols={{ base: 2, sm: 3 }} w={"100%"}>
        <CategoriesDisplay label="Maturidade do projeto" badges={["Ideia"]} />
        <CategoriesDisplay label="Plataformas suportadas" badges={["Web"]} />
        <CategoriesDisplay label="Plataformas suportadas" badges={["Web"]} />
        
      </SimpleGrid>

      <Text>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae nam
        sequi dicta? Ducimus ut eius accusantium. Obcaecati aperiam et quisquam
        perferendis officia quos assumenda, pariatur, eveniet sunt nisi, nobis
        alias. Lorem ipsum dolor sit amet consectetur adipisicing elit. A quas
        adipisci doloremque non tenetur illum atque rem error molestias,
        ducimus, amet reprehenderit praesentium id ad quia perferendis. Enim,
        voluptatum molestias? Lorem ipsum dolor sit amet consectetur,
        adipisicing elit. Atque ipsum veritatis reprehenderit recusandae ut
        voluptatibus vitae quibusdam quisquam quis nesciunt quam voluptate
        dolorum, doloremque et magni aliquam deleniti tempora dolor!
      </Text>
    </Stack>
  );
}
