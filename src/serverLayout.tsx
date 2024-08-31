import { Footer, LinksList } from "./layout/Footer";
import { Loading } from "./layout/Loading";
import { SetMeta, SetMetaProps } from "./routes/SetMeta";
import { CommonContext } from "./types/HonoCustomType";
import { parseImageItems } from "./data/functions/images";
import SiteConfigList from "./data/config.list";
import { renderToString } from "react-dom/server";
import { Context, Next } from "hono";
import { getPostsData } from "./blog/be-functions";

export function SetMetaServerSide(args: SetMetaProps) {
  return <SetMeta {...args} />;
}

export function DefaultMeta() {
  return (
    <>
      <meta charSet="utf-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
    </>
  );
}

export function DefaultBody({
  after,
  env,
}: {
  after?: React.ReactNode;
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
            <LinksList myLinks={SiteConfigList.links || []} maskImage={false} />
          </footer>
        </div>
      </main>
      {after}
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
  characters?: CharaObjectType;
  meta?: React.ReactNode;
  styles?: React.ReactNode;
  script?: React.ReactNode;
  noindex?: boolean;
  isLogin?: boolean;
}
export async function ServerLayout({
  c,
  characters,
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
  let images: MediaImageItemType[] | undefined;
  let posts: Post[] = [];
  if (isBot) {
    const dataPath = "/json";
    const isCharaName = Boolean(params.charaName);
    if (isCharaName && !characters) {
      const r_characters = await fetch(
        Url.origin + dataPath + "/characters.json"
      );
      characters = judgeJson(r_characters)
        ? await r_characters.json()
        : undefined;
    }
    if (isCharaName || Url.searchParams.has("image")) {
      const jsonPath = Url.origin + dataPath + "/images.json";
      const r_images = await fetch(jsonPath);
      images = judgeJson(r_images)
        ? parseImageItems(await r_images.json())
        : undefined;
    }
    if (Url.searchParams.has("postId")) posts = await getPostsData(c);
  }
  return (
    <html lang="ja">
      <head>
        <DefaultMeta />
        <SetMetaServerSide
          url={url}
          path={c.req.path}
          query={c.req.query()}
          characters={characters}
          images={images}
          posts={posts}
          noindex={noindex}
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
      <DefaultBody
        after={
          <>
            <script id="server-data" data-is-login={isLogin} />
            {script}
          </>
        }
        env={c.env}
      />
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
        const chara = characters[name];
        if (!chara) return next();
      }
      break;
    case "gallery/:group":
      const req = (c as Context<MeeBindings, typeof path, any>).req;
      const group = req.param("group");
      const f = SiteConfigList.gallery.generate.some((v) => v.name === group);
      if (!f) return next();
      break;
  }
  return c.html(
    renderToString(await ServerLayout({ c, path, characters, ...args }))
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
          <Footer />
        </div>
      </body>
    </html>
  );
}

export function ServerNotFound({ env }: { env?: SiteConfigEnv }) {
  return (
    <ServerSimpleLayout title={"404 | " + env?.TITLE} noindex={true} env={env}>
      <main className="h1h4Page middle">
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
      <main className="h1h4Page middle">
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
