import { Group } from "@mantine/core";
import { Link, LinkProps } from "@tanstack/react-router";
import { ReactNode } from "react";
import classes from "./nav-link.module.css";

type NavLinkProps = {
  title: string;
  icon: ReactNode;
  to: LinkProps["to"];
  disabled?: boolean;
};

export function NavLink({ title, icon, to, disabled }: NavLinkProps) {
  return (
    <Link
      to={to}
      activeProps={{ className: classes.active }}
      className={disabled ? classes.disabled : classes.link}
      disabled={disabled}
    >
      <Group gap={"xxs"}>
        {icon}
        {title}
      </Group>
    </Link>
  );
}
