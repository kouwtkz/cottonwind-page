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
import { Footer } from "./components/Footer";
import { SetLoaderEnv, SetMetaDefault } from "./components/SetMeta";

export const links: Route.LinksFunction = () => [];

export function meta({ data }: Route.MetaArgs) {
  // console.log(data);
  return [...SetMetaDefault({ data })];
}

interface RootMetaArgsType {
  image?: string;
  since?: string;
  account?: string;
  title?: string;
  description?: string;
}

export async function loader({ context }: Route.LoaderArgs) {
  const env = getCfEnv({ context });
  return {
    ...SetLoaderEnv(env),
    image: env.SITE_IMAGE,
    since: env.SINCE,
    account: env.AUTHOR_ACCOUNT,
  } as RootMetaArgsType;
}

let clientServerData: RootMetaArgsType | null = null;

export async function clientLoader({
  request,
  serverLoader,
  params,
}: Route.ClientLoaderArgs) {
  if (!clientServerData) {
    const serverData = await serverLoader();
    clientServerData = serverData;
    return serverData;
  } else return clientServerData;
}
clientLoader.hydrate = true;

export default function App({ loaderData, ...e }: Route.ComponentProps) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {/* <Loading /> */}
        <main id="root">
          <HeaderClient loaderData={loaderData} {...e} />
          <div className="content-base">
            <div className="contant-parent">
              <Outlet />
            </div>
          </div>
          <Footer loaderData={loaderData} {...e} />
        </main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "めぇ！（エラー）";
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
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <h1>{message}</h1>
        <p>{details}</p>
        {stack && (
          <pre>
            <code>{stack}</code>
          </pre>
        )}
      </body>
    </html>
  );
}
