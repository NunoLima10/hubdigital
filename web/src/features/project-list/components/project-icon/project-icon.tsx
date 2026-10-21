import { Avatar } from "@mantine/core";
import { Project } from "../../types/project";

type ProjectIconProps = Pick<Project, "name" | "iconUrl"> & {
  size?: number;
  className?: string;
};

export function ProjectIcon({
  name,
  iconUrl,
  size = 70,
  className,
}: ProjectIconProps) {
  return (
    <Avatar
      className={className}
      src={iconUrl}
      name={name}
      alt={name}
      color="initials"
      size={size}
      radius="lg"
    />
  );
}
