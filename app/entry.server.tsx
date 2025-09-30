import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { getCfDB, getCfEnv } from "./data/cf/getEnv";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
    }
  );
  shellRendered = true;

  // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");

  // const env = getCfEnv({ context: _loadContext });
  const db = getCfDB({ context: _loadContext })!;
  const Url = new URL(request.url);
  try {
    const redirectCheck = (
      await db.select<redirectDataType>({
        table: "redirect",
        where: { path: Url.pathname },
      })
    )[0];
    if (redirectCheck) {
      Url.pathname = redirectCheck.redirect;
      // Url.search = "";
      // Url.hash = "";
      return Response.redirect(Url.href);
    }
  } catch {}

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
