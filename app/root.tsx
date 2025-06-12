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
import {
  charactersDataIndexed,
  clientDBLoader,
  imageDataIndexed,
} from "./data/ClientDBLoader";
import { useEffect, useMemo } from "react";
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
import {
  autoFixGalleryTagsOptions,
  defaultGalleryTags,
  getTagsOptions,
} from "./components/dropdown/SortFilterTags";

export function links(): LinkDescriptor[] {
  return [{ rel: "stylesheet", href: "/static/styles/laymic.min.css" }];
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
  const isComplete = useIsComplete()[0];
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
