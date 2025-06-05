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
import { SetMetaDefault } from "./components/SetMeta";
import { rootClientServerData, type SetRootMetaProps } from "./data/rootData";
import "./data/ClientDBLoader";
import { ClientDBLoader } from "./data/ClientDBLoader";
import { useEffect, type ReactNode } from "react";
import { ImageState, useImageState } from "./components/state/ImageState";
import {
  CharacterState,
  useCharacters,
} from "./components/state/CharacterState";
import PostState from "./components/state/PostState";
import { SoundState } from "./components/state/SoundState";
import FileState from "./components/state/FileState";
import { LinksState } from "./components/state/LinksState";
import { LikeState } from "./components/state/LikeState";
import { KeyValueDBState } from "./components/state/KeyValueDBState";
import type { OmittedEnv } from "types/custom-configuration";
import { waitEnvResolve } from "./data/ClientEnvLorder";
import { EnvState, useEnv } from "./components/state/EnvState";
import { DefaultImportScripts } from "./clientScripts";
import { ClickEventState } from "./components/click/useClickEvent";
import { getSession } from "./sessions.server";

export const links: Route.LinksFunction = () => [];

interface MetaArgs extends Omit<Route.MetaArgs, "data"> {
  data?: SetRootMetaProps;
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  return {
    env: getCfEnv({ context }),
    isLogin: session.has("LoginToken"),
  } as SetRootMetaProps;
}

export function meta({ data }: MetaArgs) {
  return SetMetaDefault({ env: data?.env });
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  let clientServerData = rootClientServerData.data;
  if (!clientServerData) {
    const serverData = (await serverLoader()) as SetRootMetaProps;
    clientServerData = serverData || null;
    rootClientServerData.data = clientServerData;
    if (serverData?.env) waitEnvResolve(serverData.env);
  }
  if (clientServerData.env) {
    ClientDBLoader({ env: clientServerData.env });
  }
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
        <DefaultImportScripts />
      </head>
      <body>
        <main id="root">{children}</main>
      </body>
    </html>
  );
}

function SetState({
  env,
  isLogin,
}: {
  env?: Partial<OmittedEnv>;
  isLogin?: boolean;
}) {
  return (
    <>
      <EnvState env={env} isLogin={isLogin} />
      <ClickEventState />
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
  const [env] = useEnv();
  useEffect(() => {
    console.log(env);
  }, [env]);
  return <></>;
}

export default function App({ loaderData, ...e }: Route.ComponentProps) {
  return (
    <>
      {/* <Loading /> */}
      <SetState env={loaderData.env} isLogin={loaderData.isLogin} />
      {/* <Test /> */}
      <HeaderClient env={loaderData.env} {...e} />
      <div className="content-base">
        <div className="content-parent">
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
    <>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </>
  );
}

export function matchesRoot(matches: any[]) {
  return matches.find((m) => m.id === "root") as
    | RouterMatchesType<SetRootMetaProps>
    | undefined;
}
