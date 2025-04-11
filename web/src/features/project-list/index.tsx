import calendarios from "@assets/calendarios.webp";
import less from "@assets/less.webp";
import nhafarmacia from "@assets/nhafarmacia.webp";
import notifika from "@assets/notifika.webp";
import { Stack } from "@mantine/core";
import { Projectcard } from "./components/project-card/project-card";

export function ProjectList() {
  return (
    <Stack gap={40}>
      <Projectcard
        title="Notifika"
        id={1}
        description="Conectamos empresas a clientes, tornando a comunicação direta mais eficiente em tempo real."
        topis={["Comunicação", "SaaS", "B2B"]}
        upCount={0}
        iconUrl={notifika}
        website="https://notifika.cv/"
      />
      <Projectcard
        title="NhaFarma"
        id={2}
        description="Encontre farmácias de serviço em Cabo Verde, com praticidade e eficiência."
        topis={["Informação", "SaaS", "B2C"]}
        upCount={10}
        iconUrl={nhafarmacia}
        website="https://www.nhafarma.cv/"
      />
      <Projectcard
        title="Calendario.cv"
        id={3}
        description="Encontre farmácias de serviço em Cabo Verde, com praticidade e eficiência."
        topis={["Informação", "SaaS", "B2C"]}
        upCount={100}
        iconUrl={calendarios}
        website="https://www.calendario.cv/"
      />
      <Projectcard
        title="Chuva Less"
        id={4}
        description="O Less automatiza a criação, o gerenciamento e a implantação de sua infraestrutura de nuvem"
        topis={["Serviço", "Cloud", "B2B"]}
        upCount={1000}
        iconUrl={less}
        website="https://less.chuva.io/"
      />

      <Projectcard.Loading />
    </Stack>
  );
}
