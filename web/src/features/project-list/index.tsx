import icon from "@assets/Icon3D.webp";
import { Stack } from "@mantine/core";
import { Projectcard } from "./components/project-card/project-card";

export function ProjectList() {
  return (
    <Stack gap={40}>
      <Projectcard
        title="Notifika"
        id={1}
        description=" Lorem ipsum dolor sit, amet consectetur adipisicing elit. Cum fuga deleniti"
        topis={["1", "2", "3"]}
        upCount={10}
        iconUrl={icon}
        website="https://notifika.cv/"
      />
      <Projectcard
        title="Notifika"
        id={2}
        description=" Lorem ipsum dolor sit, amet consectetur adipisicing elit. Cum fuga deleniti dzdadzda a ae eaeaezfzegzggz"
        topis={["1", "2", "3"]}
        upCount={10}
        iconUrl={icon}
        website="https://notifika.cv/"
      />
      <Projectcard
        title="Notifika"
        id={3}
        description=" Lorem ipsum dolor sit, amet consectetur adipisicing elit. Cum fuga deleniti"
        topis={["1", "2", "3"]}
        upCount={10}
        iconUrl={icon}
        website="https://notifika.cv/"
      />
      <Projectcard
        title="Notifika"
        id={4}
        description=" Lorem ipsum dolor sit, amet consectetur adipisicing elit. Cum fuga deleniti"
        topis={["1", "2", "3"]}
        upCount={10}
        iconUrl={icon}
        website="https://notifika.cv/"
      />
    </Stack>
  );
}
