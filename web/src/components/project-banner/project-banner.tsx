import { Center, Stack, Text } from "@mantine/core";
import { IconPhoto } from "@tabler/icons-react";
import classes from "./project-banner.module.css";

type ProjectBannerProps = {
  bannerUrl?: string | null;
  className?: string;
};

export function ProjectBanner({ bannerUrl, className }: ProjectBannerProps) {
  const rootClassName = className
    ? `${classes.banner} ${className}`
    : classes.banner;

  if (bannerUrl) {
    return (
      <div className={rootClassName}>
        <img src={bannerUrl} alt="" className={classes.image} />
      </div>
    );
  }

  return (
    <Center className={`${rootClassName} ${classes.placeholder}`}>
      <Stack align="center" gap={4}>
        <IconPhoto size={32} stroke={1.5} />
        <Text size="xs" c="dimmed">
          Imagem em breve
        </Text>
      </Stack>
    </Center>
  );
}
