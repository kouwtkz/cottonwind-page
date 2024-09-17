import { Footer, LinksList } from "./layout/Footer";
import { Loading } from "./layout/Loading";
import { SetMeta, SetMetaProps } from "./routes/SetMeta";
import { CommonContext } from "./types/HonoCustomType";
import { renderHtml } from "./functions/render";
import { Context, Next } from "hono";
import { getPostsData } from "@/functions/blogFunction";
import SvgMaskSns from "./components/svg/mask/SvgMaskSns";
import { MeeSqlD1 } from "./functions/MeeSqlD1";
import { getCharacterMap } from "./functions/characterFunctions";
import { toImageType } from "./functions/imageFunctions";
import { getMediaOrigin } from "./functions/originUrl";

export function DefaultMeta() {
  return (
    <>
      <meta charSet="utf-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
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
    <body className="loading dummy">
      <Loading />
      <main id="root">
        <div hidden>
          <header className="title-container">
            <a href="/">
              <h2>
                <img
                  src="/static/images/webp/cottonwind_logo_min.webp"
                  alt={env?.TITLE}
                />
              </h2>
            </a>
          </header>
          <footer>
            <LinksList myLinks={env?.LINKS || []} maskImage={false} />
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

export interface ServerLayoutProps {
  c: CommonContext<MeePagesEnv>;
  path: string;
  characters?: Map<string, CharacterType>;
  meta?: React.ReactNode;
  styles?: React.ReactNode;
  script?: React.ReactNode;
  noindex?: boolean;
  isLogin?: boolean;
}
export async function ServerLayout({
  c,
  characters: charactersMap,
  meta,
  styles,
  script,
  noindex,
  isLogin = false,
}: ServerLayoutProps) {
  const url = c.req.url;
  const Url = new URL(url);
  const isBot = /http|bot|spider\/|facebookexternalhit/i.test(
    c.req.header("user-agent") ?? ""
  );
  const params = c.req.param() as KeyValueStringType;
  let imagesMap = new Map<string, ImageType>();
  let posts: PostType[] = [];
  if (isBot) {
    const db = new MeeSqlD1(c.env.DB);
    async function ImageSelectFromKey(key: string) {
      return (
        await db.select<ImageDataType>({
          table: "images",
          where: { key },
          take: 1,
        })
      )[0];
    }
    if (c.env.SITE_IMAGE) {
      const data = await ImageSelectFromKey(c.env.SITE_IMAGE);
      if (data) imagesMap.set(data.key, toImageType(data));
    }
    const isCharaName = Boolean(params.charaName);
    if (Url.searchParams.has("image")) {
      const key = Url.searchParams.get("image")!;
      const data = await ImageSelectFromKey(key);
      if (data) imagesMap.set(key, toImageType(data));
    }
    if (isCharaName && !charactersMap) {
      charactersMap = getCharacterMap(
        await db.select<CharacterDataType>({
          table: "characters",
          where: { key: params.charaName },
          take: 1,
        })
      );
      await Promise.all(
        Object.values(Object.fromEntries(charactersMap)).map(
          async (character) => {
            character.media = {};
            if (character.image) {
              character.media.image = toImageType(
                await ImageSelectFromKey(character.image)
              );
            }
            if (character.headerImage) {
              character.media.headerImage = toImageType(
                await ImageSelectFromKey(character.headerImage)
              );
            }
            if (character.icon) {
              character.media.icon = toImageType(
                await ImageSelectFromKey(character.icon)
              );
            }
          }
        )
      );
    }
    if (Url.searchParams.has("postId")) posts = await getPostsData(c);
  }
  return (
    <html lang="ja">
      <head>
        <DefaultMeta />
        <SetMeta
          url={url}
          path={c.req.path}
          query={c.req.query()}
          charactersMap={charactersMap}
          imagesMap={imagesMap}
          posts={posts}
          noindex={noindex}
          mediaOrigin={getMediaOrigin(c.env, Url.origin)}
          env={c.env}
        />
        {c.env.RECAPTCHA_SITEKEY ? (
          <script
            src={
              "https://www.google.com/recaptcha/api.js?render=" +
              c.env.RECAPTCHA_SITEKEY
            }
          />
        ) : null}
        {meta}
        {styles}
      </head>
      <DefaultBody env={c.env}>
        {" "}
        <script id="server-data" data-is-login={isLogin} />
        {script}
      </DefaultBody>
    </html>
  );
}

export async function ReactResponse({
  c,
  next,
  path,
  characters,
  ...args
}: ServerLayoutProps & { next: Next }) {
  switch (path) {
    case "character":
      const name = c.req.query("name");
      if (name) return c.redirect("/character/" + name);
      break;
    case "character/:charaName":
      if (characters) {
        const req = (c as Context<MeeBindings, typeof path, any>).req;
        const name = req.param("charaName");
        const chara = characters.get(name);
        if (!chara) return next();
      }
      break;
    case "gallery/:group":
      const req = (c as Context<MeeBindings, typeof path, any>).req;
      const group = req.param("group");
      const f = c.env.IMAGE_ALBUMS?.some((v) => v.name === group);
      if (!f) return next();
      break;
  }
  return c.html(
    renderHtml(await ServerLayout({ c, path, characters, ...args }))
  );
}

export function ServerSimpleLayout({
  title,
  noindex,
  children,
  env,
}: {
  title?: string;
  noindex?: boolean;
  children?: React.ReactNode;
  env?: SiteConfigEnv;
}) {
  return (
    <html lang="ja">
      <head>
        <DefaultMeta />
        <title>{title ?? env?.TITLE}</title>
        {noindex ? <meta name="robots" content="noindex" /> : null}
        <Style
          href={"/css/styles.css" + (env?.VERSION ? "?v=" + env.VERSION : "")}
        />
      </head>
      <body>
        <header id="header">
          <div className="title-container">
            <a id="siteTitle" href="/" title={env?.TITLE}>
              <h2>
                <img
                  src="/static/images/webp/cottonwind_logo_min.webp"
                  alt={env?.TITLE}
                />
              </h2>
            </a>
          </div>
        </header>
        <div className="content-base">
          {children}
          <Footer env={env} />
        </div>
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
