import { getCfEnv } from "~/data/cf/getEnv";
import type { Route } from "./+types/discord";

export function loader({ context, request, params }: Route.LoaderArgs) {
  const env = getCfEnv({ context });
  switch (params.action) {
    case "invite":
      const Url = new URL(request.url);
      const invite_password = Url.searchParams.get("invite_password");
      if (invite_password) {
        if (env.DISCORD_INVITE_URL && env.DISCORD_INVITE_ANSWER === invite_password) {
          return new Response(env.DISCORD_INVITE_URL);
        } else return new Response("failed", { status: 401 })
      } else if (env.DISCORD_INVITE_QUESTION) {
        return env.DISCORD_INVITE_QUESTION;
      } else return ""
  }
}