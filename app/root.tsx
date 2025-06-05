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
import { getCfOmitEnv } from "./data/cf/getEnv";
import { HeaderClient } from "./components/Header";
import { Footer } from "./components/Footer";
import { SetMetaDefault } from "./components/SetMeta";
import { rootClientServerData, type SetRootProps } from "./data/rootData";
import "./data/ClientDBLoader";
import { clientDBLoader } from "./data/ClientDBLoader";
import { useEffect, useMemo, type ReactNode } from "react";
import { ImageState, useImageState } from "./components/state/ImageState";
import {
  CharacterState,
  useCharacters,
} from "./components/state/CharacterState";
import PostState, { usePosts } from "./components/state/PostState";
import { SoundState, useSounds } from "./components/state/SoundState";
import FileState from "./components/state/FileState";
import { LinksState, useLinks } from "./components/state/LinksState";
import { LikeState } from "./components/state/LikeState";
import { KeyValueDBState } from "./components/state/KeyValueDBState";
import type { OmittedEnv } from "types/custom-configuration";
import { waitEnvResolve } from "./data/ClientEnvLorder";
import { EnvState, useEnv } from "./components/state/EnvState";
import { DefaultImportScripts } from "./clientScripts";
import { ClickEventState } from "./components/click/useClickEvent";
import { getSession } from "./sessions.server";
import { ToastContainer } from "react-toastify";
import { defaultToastContainerOptions } from "./components/define/toastContainerDef";
import { ImageViewer } from "./components/layout/ImageViewer";
import { HomeImageState } from "./page/Home";
import { MiniGallery } from "./page/GalleryPage";
import { Loading } from "./components/layout/Loading";
import { SetState, useIsComplete } from "./components/state/SetState";

export const links: Route.LinksFunction = () => [];

interface MetaArgs extends Omit<Route.MetaArgs, "data"> {
  data?: SetRootProps;
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  return {
    env: getCfOmitEnv({ context }),
    isLogin: session.has("LoginToken"),
    isComplete: false,
  } as SetRootProps;
}

export function meta({ data }: MetaArgs) {
  return SetMetaDefault({ env: data?.env });
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  let clientServerData = rootClientServerData.data;
  if (!clientServerData) {
    const serverData = (await serverLoader()) as SetRootProps;
    clientServerData = serverData || null;
    rootClientServerData.data = clientServerData;
    if (serverData?.env) waitEnvResolve(serverData.env);
  }
  if (clientServerData.env) {
    clientDBLoader({ env: clientServerData.env }).then(() => {
      // rootClientServerData.data!.isComplete = true;
    });
  }
  return clientServerData;
}
clientLoader.hydrate = true;

function Test() {
  const [env] = useEnv();
  useEffect(() => {
    console.log(env);
  }, [env]);
  return <></>;
}

interface BaseLayoutProps {
  className?: string;
  children?: React.ReactNode;
}
function BaseLayout({ children, className }: BaseLayoutProps) {
  return (
    <html lang="ja" className={className}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <DefaultImportScripts />
      </head>
      {children}
    </html>
  );
}

export default function App({ loaderData, ...e }: Route.ComponentProps) {
  const isCompleteState = useIsComplete()[0];
  const isComplete = useMemo(() => {
    return isCompleteState && loaderData.isComplete;
  }, [isCompleteState, loaderData.isComplete]);
  const htmlClassName = useMemo(() => {
    const classNames: string[] = [];
    if (classNames.length > 0) return classNames.join(" ");
  }, []);
  const bodyClassName = useMemo(() => {
    const classNames: string[] = [];
    if (!isComplete) classNames.push("loading", "dummy");
    return classNames.join(" ");
  }, [isComplete]);
  return (
    <BaseLayout className={htmlClassName}>
      <body className={bodyClassName}>
        {isComplete ? null : <Loading />}
        <main>
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
        </main>
        <Scripts />
      </body>
    </BaseLayout>
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
    <BaseLayout>
      <body>
        <h1>{message}</h1>
        <p>{details}</p>
        {stack && (
          <pre>
            <code>{stack}</code>
          </pre>
        )}
      </body>
    </BaseLayout>
  );
}

export function matchesRoot(matches: any[]) {
  return matches.find((m) => m.id === "root") as
    | RouterMatchesType<SetRootProps>
    | undefined;
}
