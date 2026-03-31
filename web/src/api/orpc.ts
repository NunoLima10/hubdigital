import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createORPCReactQueryUtils } from "@orpc/react-query";
import type { AppRouterClient } from "@hubdigital/api/orpc/router";
import { env } from "@app/env";

const link = new RPCLink({
  url: `${env.API_URL}/rpc`,
  fetch: (request, init) => fetch(request, { ...init, credentials: "include" }),
});

export const orpc = createORPCClient<AppRouterClient>(link);
export const orpcUtils = createORPCReactQueryUtils(orpc);
