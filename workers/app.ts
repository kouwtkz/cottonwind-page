import { createRequestHandler } from "react-router";
import { getMimeType } from "~/components/utils/mime";
import { CleanDeployScheduled } from "./clean-deploy";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

async function media(request: Request, env: Env, ctx: ExecutionContext, _Url?: URL): Promise<Response> {
  const Url = _Url ? _Url : new URL(request.url);
  const mediaPathname = Url.pathname.replace(/^\/media/, "");
  const pathname = decodeURI(mediaPathname);
  const filename = pathname.slice(pathname.indexOf("/", 0) + 1);
  if (filename && env.BUCKET) {
    const mimeType = getMimeType(filename);
    const data = await env.BUCKET.get(filename).then(r => r?.blob());
    if (data)
      return new Response(await data.arrayBuffer(), {
        headers: mimeType ? { "Content-Type": mimeType } : {},
      });
  }
  return new Response("Not found.", { status: 404 });
}

export default {
  async fetch(request, env, ctx) {
    const Url = new URL(request.url);
    if (/^\/media(\/|$)/.test(Url.pathname)) {
      return media(request, env, ctx, Url);
    } else {
      return requestHandler(request, {
        cloudflare: { env, ctx },
      });
    }
  },
  scheduled: CleanDeployScheduled
} satisfies ExportedHandler<Env>;
