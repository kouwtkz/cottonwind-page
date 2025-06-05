import type { Route } from "./+types/media";
import { getMimeType } from "./components/utils/mime";
import { getCfEnv } from "./data/cf/getEnv";

function getMediaPathname(url: string) {
  const Url = new URL(url);
  return Url.pathname.replace(/^\/media/, "");
}

export async function loader({ request, context }: Route.ActionArgs) {
  const env = getCfEnv({ context });
  const pathname = decodeURI(getMediaPathname(request.url));
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