import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./styles/styles.scss";
import "./styles/styles_lib.scss";
import { getCfEnv } from "./data/cf/getEnv";
import { HeaderClient } from "./components/Header";

export const links: Route.LinksFunction = () => [];

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: data?.title },
    { name: "og:title", content: data?.description },
    { name: "description", content: data?.description },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const env = getCfEnv({ context });
  return {
    title: env.TITLE,
    description: env.DESCRIPTION,
    image: env.SITE_IMAGE,
  };
}

export default function App({ loaderData, ...e }: Route.ComponentProps) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="dummy">
        {/* <Loading /> */}
        <main id="root">
          <HeaderClient loaderData={loaderData} {...e} />
          <div className="content-base">
            <div className="contant-parent">
              <Outlet />
            </div>
          </div>
          <footer>
            {/* <LinksList
                myLinks={ArrayEnv.LINKS || []}
                noMaskImage
                noShareButton
              /> */}
          </footer>
        </main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "めぇ！";
  let details = "エラーです…！";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
