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
import { SetMetaDefault, type SetMetaProps } from "./components/SetMeta";
import "./data/ClientDBLoader";
import { ClientDBLoader } from "./data/ClientDBLoader";
import { useEffect, type ReactNode } from "react";
import { ImageState, useImageState } from "./components/state/ImageState";
import { CharacterState } from "./components/state/CharacterState";
import PostState from "./components/state/PostState";
import { SoundState } from "./components/state/SoundState";
import FileState from "./components/state/FileState";
import { LinksState } from "./components/state/LinksState";
import { LikeState } from "./components/state/LikeState";
import { KeyValueDBState } from "./components/state/KeyValueDBState";

export const links: Route.LinksFunction = () => [];

interface MetaArgs extends Route.MetaArgs {
  data: SetMetaProps;
}
export function meta({ data }: MetaArgs) {
  return [...SetMetaDefault({ env: data.env })];
}

export async function loader({ context }: Route.LoaderArgs) {
  return {
    env: getCfEnv({ context }),
  } as SetMetaProps;
}

let clientServerData: SetMetaProps | null = null;

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  if (!clientServerData) {
    const serverData = (await serverLoader()) as SetMetaProps;
    clientServerData = serverData || null;
  }
  if (clientServerData.env) ClientDBLoader({ env: clientServerData.env });
  return clientServerData;
}
clientLoader.hydrate = true;

export function Layout({ children }: { children?: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <main id="root">{children}</main>
      </body>
    </html>
  );
}

function SetState() {
  return (
    <>
      <ImageState />
      <CharacterState />
      <PostState />
      <SoundState />
      <FileState />
      <LinksState />
      <LikeState />
      <KeyValueDBState />
    </>
  );
}
function Test() {
  const { images } = useImageState();
  useEffect(() => {
    console.log(images);
  }, [images]);
  return <></>;
}

export default function App({ loaderData, ...e }: Route.ComponentProps) {
  return (
    <>
      {/* <Loading /> */}
      <SetState />
      <Test />
      <HeaderClient env={loaderData.env} {...e} />
      <div className="content-base">
        <div className="contant-parent">
          <Outlet />
        </div>
      </div>
      <Footer env={loaderData.env} {...e} />
      <ScrollRestoration />
      <Scripts />
    </>
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
