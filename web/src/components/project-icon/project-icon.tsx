import { Avatar } from "@mantine/core";
import { IconRocket } from "@tabler/icons-react";

type ProjectIconProps = {
  iconUrl?: string;
  className?: string;
  size?: number;
};

export function ProjectIcon({ iconUrl, className, size }: ProjectIconProps) {
  if (iconUrl) {
    return <img src={iconUrl} className={className}></img>;
  }

  return (
    <Avatar size={size} radius={"lg"} className={className}>
      <IconRocket size={28} />
    </Avatar>
  );
}
