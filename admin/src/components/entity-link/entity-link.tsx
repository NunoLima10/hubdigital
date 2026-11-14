import { Anchor, AnchorProps } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";

type EntityLinkProps = AnchorProps & { children: ReactNode };

/**
 * Mantine's polymorphic `component={Link}` erases TanStack Router's route
 * typing, so `params` stops being checked against the route. Rendering the Link
 * as the anchor's root instead keeps both: Mantine's styling and the router's
 * typed params.
 */
export function ProjectLink({
  id,
  children,
  ...props
}: EntityLinkProps & { id: number | string }) {
  return (
    <Anchor
      {...props}
      renderRoot={(rootProps) => (
        <Link to="/projects/$id" params={{ id: String(id) }} {...rootProps} />
      )}
    >
      {children}
    </Anchor>
  );
}

export function UserLink({
  id,
  children,
  ...props
}: EntityLinkProps & { id: string }) {
  return (
    <Anchor
      {...props}
      renderRoot={(rootProps) => (
        <Link to="/users/$id" params={{ id }} {...rootProps} />
      )}
    >
      {children}
    </Anchor>
  );
}
