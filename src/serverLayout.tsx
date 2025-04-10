import { Footer, LinksList } from "./layout/Footer";
import { Loading } from "./layout/Loading";
import { SetMeta, SetMetaProps } from "./routes/SetMeta";
import { CommonContext } from "./types/HonoCustomType";
import { renderHtml } from "./functions/render";
import { Context, Next } from "hono";
import { getPostsData } from "@/functions/blogFunction";
import SvgMaskSns from "./components/svg/mask/SvgMaskSns";
import { MeeSqlD1 } from "@/data/functions/MeeSqlD1";
import { getCharacterMap } from "@/functions/characterFunction";
import { toImageType } from "@/functions/media/imageFunction";
import { getMediaOrigin } from "./functions/originUrl";
import { ImageSelectFromKey } from "./functions/media/serverDataFunction";
import { ArrayEnv } from "@/Env";
import { charaTableObject } from "./api/character";
import { defaultLang, TITLE_IMAGE_PATH } from "./multilingual/envDef";
import { DefaultImportScripts } from "./clientScripts";
import { postsDataOptions } from "./data/DataEnv";

export interface DefaultMetaProps {
  favicon?: string;
}
export function DefaultMeta({ favicon = "/favicon.ico" }: DefaultMetaProps) {
  return (
    <>
      <meta charSet="utf-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <link rel="icon" href={favicon} />
    </>
  );
}

export function DefaultBody({
  children,
  env,
}: {
  children?: React.ReactNode;
  env?: SiteConfigEnv;
}) {
  return (
    <body className="dummy">
      <Loading />
      <main id="root">
        <div hidden>
          <header className="title-container">
            <a href="/">
              <h2>
                {TITLE_IMAGE_PATH ? (
                  <img src={TITLE_IMAGE_PATH} alt={env?.TITLE} />
                ) : (
                  env?.TITLE
                )}
              </h2>
            </a>
          </header>
          <footer>
            <LinksList myLinks={ArrayEnv.LINKS || []} maskImage={false} />
          </footer>
        </div>
      </main>
      {children}
      <SvgMaskSns />
    </body>
  );
}

function judgeJson(r: Response) {
  return (
    r.status === 200 &&
    r.headers.get("content-type")?.includes("application/json")
  );
}

interface defaultServerLayoutProps extends DefaultMetaProps {
  meta?: React.ReactNode;
  style?: React.ReactNode;
  headScript?: React.ReactNode;
  bodyScript?: React.ReactNode;
  noindex?: boolean;
}

export interface ServerLayoutProps extends defaultServerLayoutProps {
  c: CommonContext<MeePagesEnv>;
  path: string;
  characters?: Map<string, CharacterType>;
  isLogin?: boolean;
}
export async function ServerLayout({
  c,
  characters: charactersMap,
  meta,
  style,
  headScript,
  bodyScript,
  noindex,
  isLogin = false,
  path,
  ...defaultMetaArgs
}: ServerLayoutProps) {
  const env = AddMetaEnv(c.env);
  const url = c.req.url;
  const Url = new URL(url);
  const isBot = /http|bot|spider\/|facebookexternalhit/i.test(
    c.req.header("user-agent") ?? ""
  );
  let image: ImageType | undefined;
  let post: PostDataType | undefined;
  if (isBot || import.meta.env!.DEV) {
    const db = new MeeSqlD1(env.DB);
    if (Url.searchParams.has("image")) {
      const key = Url.searchParams.get("image")!;
      const data = await ImageSelectFromKey(db, key);
      if (data) image = toImageType(data);
    }
    if (charactersMap) {
      await Promise.all(
        Object.values(Object.fromEntries(charactersMap)).map(
          async (character) => {
            character.media = {};
            if (character.image) {
              character.media.image = toImageType(
                await ImageSelectFromKey(db, character.image)
              );
            }
            if (character.headerImage) {
              character.media.headerImage = toImageType(
                await ImageSelectFromKey(db, character.headerImage)
              );
            }
            if (character.icon) {
              character.media.icon = toImageType(
                await ImageSelectFromKey(db, character.icon)
              );
            }
          }
        )
      );
    }
    if (!image && env.SITE_IMAGE) {
      const data = await ImageSelectFromKey(db, env.SITE_IMAGE);
      if (data) image = toImageType(data);
    }
    if (Url.searchParams.has("postId"))
      post = (
        await db.select<PostDataType>({
          table: postsDataOptions.key,
          where: { postId: Url.searchParams.get("postId")! },
        })
      )[0];
  }
  return (
    <html lang={defaultLang} className="loading">
      <head>
        <DefaultMeta {...defaultMetaArgs} />
        <SetMeta
          url={url}
          path={c.req.path}
          query={c.req.query()}
          charactersMap={charactersMap}
          imageItem={image}
          post={post}
          noindex={noindex}
          mediaOrigin={getMediaOrigin(env, Url.origin, true)}
          env={env}
        />
        {env.RECAPTCHA_SITEKEY ? (
          <script
            src={
              "https://www.google.com/recaptcha/api.js?render=" +
              env.RECAPTCHA_SITEKEY
            }
          />
        ) : null}
        {meta}
        {headScript}
        {style}
      </head>
      <DefaultBody env={env}>
        {" "}
        <script id="server-data" data-is-login={isLogin} />
        {bodyScript}
      </DefaultBody>
    </html>
  );
}

interface ReactResponseProps extends ServerLayoutProps {
  next: Next;
}

export async function DefaultReactResponse({
  headScript,
  ...props
}: ReactResponseProps) {
  return ReactResponse({
    ...props,
    headScript: (
      <>
        <script
          type="module"
          src={import.meta.env?.VITE_CLIENT_BEFORE_SCRIPT}
        />
        <DefaultImportScripts />
        <script type="module" src={import.meta.env?.VITE_CLIENT_SCRIPT} />
        {headScript}
      </>
    ),
  });
}

export async function ReactResponse({
  c,
  next,
  path,
  characters,
  ...args
}: ReactResponseProps) {
  switch (path) {
    case "character":
      const name = c.req.query("name");
      console.log(name);
      if (name) return c.redirect("/character/" + name);
      break;
    case "character/:charaName":
      if (!characters) {
        const db = new MeeSqlD1(c.env.DB);
        const req = (c as Context<MeeBindings, typeof path, any>).req;
        const key = req.param("charaName");
        const data = await charaTableObject.Select({
          db,
          where: { AND: [{ key }] },
        });
        if (data.length > 0) characters = getCharacterMap(data);
      }
      break;
  }
  return c.html(
    renderHtml(await ServerLayout({ c, path, characters, ...args }))
  );
}

export interface ServerSimpleLayoutProps extends defaultServerLayoutProps {
  title?: string;
  className?: string;
  children?: React.ReactNode;
  env?: SiteConfigEnv;
  logo?: React.ReactNode | boolean | null;
}
export function ServerSimpleLayout({
  title,
  noindex,
  className,
  children,
  meta,
  style,
  headScript,
  bodyScript,
  env,
  logo = true,
  ...defaultMetaArgs
}: ServerSimpleLayoutProps) {
  return (
    <html lang={defaultLang}>
      <head>
        <DefaultMeta {...defaultMetaArgs} />
        <title>{title ?? env?.TITLE}</title>
        {noindex ? <meta name="robots" content="noindex" /> : null}
        {meta}
        {headScript}
        <Style href="/css/styles.css" />
        <Style href="/css/styles_lib.css" />
        {style}
      </head>
      <body className={className}>
        <header id="header" className="siteHeader">
          {logo ? (
            <div className="title-container">
              <a id="siteTitle" href="/" title={env?.TITLE}>
                <h2>
                  {logo === true ? (
                    <h2>
                      {TITLE_IMAGE_PATH ? (
                        <img src={TITLE_IMAGE_PATH} alt={env?.TITLE} />
                      ) : (
                        env?.TITLE
                      )}
                    </h2>
                  ) : (
                    logo
                  )}
                </h2>
              </a>
            </div>
          ) : null}
        </header>
        <div className="content-base">
          {children}
          <Footer env={env} />
        </div>
        <SvgMaskSns />
        {bodyScript}
      </body>
    </html>
  );
}

export function ServerNotFound({ env }: { env?: SiteConfigEnv }) {
  return (
    <ServerSimpleLayout title={"404 | " + env?.TITLE} noindex={true} env={env}>
      <main className="color en-title-font middle">
        <h1>404 not found</h1>
        <h4>ページが見つかりませんでした</h4>
        <a href="/">トップページへ戻る</a>
      </main>
    </ServerSimpleLayout>
  );
}

export function ServerError({ env }: { env?: SiteConfigEnv }) {
  return (
    <ServerSimpleLayout title={"500 | " + env?.TITLE} noindex={true} env={env}>
      <main className="color en-title-font middle">
        <h1>500 Internal Server Error</h1>
        <h4>サーバー側でエラーが発生しました</h4>
        <a href="/">トップページへ戻る</a>
      </main>
    </ServerSimpleLayout>
  );
}

export function Style({
  children,
  href,
  compact = true,
}: {
  children?: any;
  href?: string;
  compact?: boolean;
}) {
  if (href) {
    return <link rel="stylesheet" href={href} />;
  } else {
    if (typeof children === "string") {
      const __html = compact ? children.replace(/\s+/g, " ") : children;
      return <style dangerouslySetInnerHTML={{ __html }} />;
    } else return <style>{children}</style>;
  }
}

export function AddMetaEnv<E extends SiteConfigEnv>(env: E): E {
  return { ...env, DEV: import.meta.env?.DEV };
}
