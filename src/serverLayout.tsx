import { Footer, SnsList } from "./components/layout/Footer";
import { Loading } from "./components/layout/Loading";
import { SetMeta, SetMetaProps } from "./routes/SetMeta";
import { CommonContext } from "./types/HonoCustomType";
import { parseImageItems } from "./data/functions/images";
import { stylesAddVer } from "./data/env";
import SiteConfigList from "./data/config.list";
import { renderToString } from "react-dom/server";
import { Context, Next } from "hono";

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

export function DefaultBody({ after }: { after?: React.ReactNode }) {
  return (
    <body className="loading dummy">
      <Loading />
      <div id="root">
        <div hidden>
          <header>
            <h2>{import.meta.env.VITE_TITLE}</h2>
          </header>
          <footer>
            <SnsList snsList={SiteConfigList.sns || []} maskImage={false} />
          </footer>
        </div>
      </div>
      {after}
    </body>
  );
}

function judgeJson(r: Response) {
  return (
    r.status === 200 && r.headers.get("content-type") === "application/json"
  );
}

export interface ServerLayoutProps {
  c: CommonContext;
  path: string;
  characters?: CharaObjectType;
  meta?: React.ReactNode;
  styles?: React.ReactNode;
  script?: React.ReactNode;
  isLogin?: boolean;
}
export async function ServerLayout({
  c,
  characters,
  meta,
  styles,
  script,
  isLogin = false,
}: ServerLayoutProps) {
  const url = c.req.url;
  const Url = new URL(url);
  const isBot = /http|bot|spider\/|facebookexternalhit/i.test(
    c.req.header("user-agent") ?? ""
  );
  let images: MediaImageItemType[] | undefined;
  if (isBot) {
    const dataPath = "/static/data";
    const params = c.req.param() as KeyValueStringType;
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
      const r_images = await fetch(Url.origin + dataPath + "/images.json");
      images = judgeJson(r_images)
        ? parseImageItems(await r_images.json())
        : undefined;
    }
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
        />
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
  title = import.meta.env.VITE_TITLE,
  noindex,
  children,
}: {
  title?: string;
  noindex?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <DefaultMeta />
        <title>{title}</title>
        {noindex ? <meta name="robots" content="noindex" /> : null}
        <Style href={"/css/styles.css" + stylesAddVer} />
      </head>
      <body>
        <header id="header">
          <div className="title-container">
            <a id="siteTitle" href="/">
              {import.meta.env.VITE_TITLE}
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

export function ServerNotFound() {
  return (
    <ServerSimpleLayout
      title={"404 | " + import.meta.env.VITE_TITLE}
      noindex={true}
    >
      <div className="h1h4Page middle">
        <h1>404 not found</h1>
        <h4>ページが見つかりませんでした</h4>
        <a href="/">トップページへ戻る</a>
      </div>
    </ServerSimpleLayout>
  );
}

export function ServerError() {
  return (
    <ServerSimpleLayout
      title={"500 | " + import.meta.env.VITE_TITLE}
      noindex={true}
    >
      <div className="h1h4Page middle">
        <h1>500 Internal Server Error</h1>
        <h4>サーバー側でエラーが発生しました</h4>
        <a href="/">トップページへ戻る</a>
      </div>
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
