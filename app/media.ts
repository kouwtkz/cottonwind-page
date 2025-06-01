import type { Route } from "./+types/media";

function getMediaPathname(url: string) {
  const Url = new URL(url);
  return Url.pathname.replace(/^\/media/, "");
}

export async function loader({ request }: Route.ActionArgs) {
  const pathname = getMediaPathname(request.url);
  return new Response(pathname, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=UTF-8",
    },
  });
}