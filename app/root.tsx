import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  type LinkDescriptor,
} from "react-router";

import type { Route } from "./+types/root";
import "./styles/styles.scss";
import "./styles/styles_lib.scss";
import { getCfDB, getCfOmitEnv } from "./data/cf/getEnv";
import { HeaderClient } from "./components/Header";
import { Footer } from "./components/Footer";
import {
  rootClientServerData,
  SetMetaDefault,
  type SetRootProps,
} from "./components/utils/SetMeta";
import "./data/ClientDBLoader";
import { clientDBLoader } from "./data/ClientDBLoader";
import { useEffect, useMemo } from "react";
import { waitEnvResolve } from "./data/ClientEnvLorder";
import { useEnv } from "./components/state/EnvState";
import { DefaultImportScripts } from "./clientScripts";
import { getSession } from "./sessions.server";
import { Loading } from "./components/layout/Loading";
import { SetState, useIsComplete } from "./components/state/SetState";
import { getAPIOrigin, getMediaOrigin } from "./components/functions/originUrl";
import { ImageTableObject } from "./routes/api/image";

export function links(): LinkDescriptor[] {
  return [{ rel: "stylesheet", href: "/static/styles/laymic.min.css" }];
}

interface MetaArgs extends Omit<Route.MetaArgs, "data"> {
  data?: SetRootProps;
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const env = getCfOmitEnv({ context });
  const Url = new URL(request.url);
  const imageParam = Url.searchParams.get("image");
  const db = getCfDB({ context });
  let image: ImageDataType | undefined;
  if (db && imageParam) {
    image = await ImageTableObject.Select({
      db,
      where: { key: imageParam },
      take: 1,
    }).then((images) => images[0]);
  }
  const apiOrigin = getAPIOrigin(env, Url.origin, true);
  const mediaOrigin = getMediaOrigin(env, Url.origin, true);
  return {
    env,
    image,
    apiOrigin,
    mediaOrigin,
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

interface LayoutProps {
  children?: React.ReactNode;
}
export function Layout({ children }: LayoutProps) {
  return (
    <html lang="ja">
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
  const bodyClassName = useMemo(() => {
    const classNames: string[] = [];
    if (!isComplete) classNames.push("loading", "dummy");
    return classNames.join(" ");
  }, [isComplete]);
  return (
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
    <body>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </body>
  );
}
