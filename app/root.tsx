import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
  type LinkDescriptor,
} from "react-router";

import type { Route } from "./+types/root";
import { getCfDB, getCfOmitEnv } from "./data/cf/getEnv";
import { HeaderClient } from "./components/Header";
import { Footer } from "./components/Footer";
import {
  rootClientServerData,
  SetMetaDefault,
  type SetRootProps,
} from "./components/utils/SetMeta";
import "./data/ClientDBLoader";
import {
  charactersDataIndexed,
  clientDBLoader,
  imageDataIndexed,
  waitIdb,
} from "./data/ClientDBLoader";
import { useEffect, useMemo, useState } from "react";
import { waitEnvResolve } from "./data/ClientEnvLorder";
import { useEnv } from "./components/state/EnvState";
import { DefaultImportScripts } from "./clientScripts";
import { getSession } from "./sessions.server";
import { Loading } from "./components/layout/Loading";
import { SetState, useIsComplete } from "./components/state/SetState";
import { getAPIOrigin, getMediaOrigin } from "./components/functions/originUrl";
import { ImageTableObject } from "./routes/api/image";
import { charaTableObject } from "./routes/api/character";
import { isbot } from "isbot";
import { ErrorBoundaryContent } from "./page/ErrorPage";
import { getCookieObjectFromHeaders } from "./components/utils/Cookie";

export function links(): LinkDescriptor[] {
  return [
    { rel: "stylesheet", href: import.meta.env.VITE_CSS_STYLES },
    { rel: "stylesheet", href: import.meta.env.VITE_CSS_LIB },
    { rel: "stylesheet", href: "/static/styles/laymic.min.css" },
  ];
}

interface MetaArgs extends Omit<Route.MetaArgs, "data"> {
  data?: SetRootProps;
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const userAgent = request.headers.get("user-agent");
  const isBot = userAgent ? isbot(userAgent) : false;
  const session = await getSession(request.headers.get("Cookie"));
  const env = getCfOmitEnv({ context });
  const Url = new URL(request.url);
  const imageParam = Url.searchParams.get("image") || env.SITE_IMAGE;
  let image: ImageDataType | string | undefined;
  let charaList: (CharacterDataType | string)[] | undefined;
  if (imageParam) {
    if (/^\/static\//.test(imageParam)) {
      image = imageParam;
    } else if (isBot) {
      const db = getCfDB({ context });
      if (db) {
        const imageItem = await ImageTableObject.Select({
          db,
          where: { key: imageParam },
          take: 1,
        }).then((images) => images[0]);
        if (imageItem?.characters) {
          const characters3 = imageItem.characters.split(",").slice(0, 3);
          const charaWhere = characters3
            .slice(0, 2)
            .map<
              MeeSqlFindWhereType<MeeSqlCreateTableEntryType<CharacterDataType>>
            >((key) => ({ key }));
          const result = await charaTableObject.Select({
            db,
            where: { OR: charaWhere },
          });
          charaList = characters3.map(
            (k) => result.find(({ key }) => key === k) || k
          );
        }
        image = imageItem;
      }
    }
  }
  const apiOrigin = getAPIOrigin(env, Url.origin, true);
  const mediaOrigin = getMediaOrigin(env, Url.origin, true);
  const cookie = getCookieObjectFromHeaders(request);
  const clientServerData = {
    env,
    image,
    rootImage: image,
    charaList,
    Url,
    apiOrigin,
    mediaOrigin,
    isLogin: session.has("LoginToken"),
    isBot,
    cookie,
  } as SetRootProps;
  clientServerData.root = clientServerData;
  return clientServerData;
}

export async function clientLoader({
  serverLoader,
  request,
}: Route.ClientLoaderArgs) {
  const Url = new URL(request.url);
  const isFirst = !Boolean(rootClientServerData.data);
  let clientServerData: SetRootProps = { ...rootClientServerData.data, Url };
  if (isFirst) {
    const serverData = (await serverLoader()) as SetRootProps;
    rootClientServerData.data = serverData;
    clientServerData = { ...rootClientServerData.data };
    if (serverData?.env) waitEnvResolve(serverData.env);
  }
  if (clientServerData.env) {
    clientDBLoader({ env: clientServerData.env });
  }
  const imageParam =
    Url.searchParams.get("image") || clientServerData.env?.SITE_IMAGE;
  if (imageParam) {
    if (/^\/static\//.test(imageParam)) {
      clientServerData.image = imageParam;
    } else {
      await waitIdb;
      if (
        typeof clientServerData.image === "string" ||
        clientServerData.image?.key !== imageParam
      ) {
        const imageItem = await imageDataIndexed.table
          .get({
            index: "key",
            query: imageParam,
          })
          .then((v) => v?.rawdata);
        clientServerData.image = imageItem;
        if (imageItem?.characters) {
          const characters = imageItem.characters.split(",").slice(0, 3);
          clientServerData.charaList = await Promise.all(
            characters.map(async (query, i) => {
              let character: CharacterDataType | undefined;
              if (i < 2) {
                character = await charactersDataIndexed.table
                  .get({
                    index: "key",
                    query,
                  })
                  .then((v) => v?.rawdata);
              }
              return character || query;
            })
          );
        }
      }
    }
  }
  clientServerData.root = clientServerData;
  return clientServerData;
}
clientLoader.hydrate = true;

export function meta({ data, location }: MetaArgs) {
  return SetMetaDefault({ ...data, location });
}

interface LayoutProps {
  children?: React.ReactNode;
}
export function Layout({ children }: LayoutProps) {
  const isComplete = useIsComplete()[0];
  const [isLoading, setIsLoading] = useState(!isComplete);
  useEffect(() => {
    if (isComplete) {
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    }
  }, [isComplete]);
  const data = useRouteLoaderData<SetRootProps>("root");
  const className = useMemo(() => {
    const classNames: string[] = [];
    if (data?.cookie) {
      const cookie = data.cookie;
      if (cookie[import.meta.env.VITE_THEME_COLOR_KEY]) {
        classNames.push(cookie[import.meta.env.VITE_THEME_COLOR_KEY]!);
      }
      if (cookie[import.meta.env.VITE_THEME_DARK_KEY]) {
        classNames.push(cookie[import.meta.env.VITE_THEME_DARK_KEY]!);
      }
      if (isLoading) {
        classNames.push("loading dummy");
      }
    }
    return classNames.join(" ");
  }, [data?.cookie, isLoading]);
  return (
    <html lang="ja" className={className}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <DefaultImportScripts />
      </head>
      <body>
        {isLoading ? <Loading /> : null}
        {children}
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData, ...e }: Route.ComponentProps) {
  return (
    <main>
      <SetState env={loaderData.env} isLogin={loaderData.isLogin} />
      <HeaderClient />
      <div className="content-base">
        <div className="content-parent">
          <Outlet />
        </div>
      </div>
      <Footer env={loaderData.env} {...e} />
      <ScrollRestoration />
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <body>
      <header id="header" className="siteHeader">
        <HeaderClient hideBackButton hideSiteMenu />
      </header>
      <ErrorBoundaryContent error={error} />
    </body>
  );
}
