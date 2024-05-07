import { SnsList } from "./components/layout/Footer";
import { Loading } from "./components/layout/Loading";
import { SetMeta, SetMetaProps } from "./routes/SetMeta";
import { serverSite as site } from "./data/server/site";
import { CommonContext } from "./types/HonoCustomType";
import { parseImageItems } from "./data/functions/images";
import { buildAddVer } from "./data/env";
const serverData = { site };

export function SetMetaServerSide(args: Omit<SetMetaProps, "site">) {
  return <SetMeta {...args} {...serverData} />;
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
            <h2>{site.title}</h2>
          </header>
          <footer>
            <SnsList snsList={site.menu?.sns || []} maskImage={false} />
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

export async function ServerLayout({
  c,
  characters,
  meta,
  styles,
  script,
  isLogin = false,
}: {
  c: CommonContext;
  characters?: CharaObjectType;
  meta?: React.ReactNode;
  styles?: React.ReactNode;
  script?: React.ReactNode;
  isLogin?: boolean;
}) {
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

export function ServerSimpleLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <DefaultMeta />
        <title>{site.title}</title>
        <Style href={"/css/styles.css" + buildAddVer} />
      </head>
      <body>
        <header id="header">
          <div className="title-container">
            <a id="siteTitle" href="/">
              {site.title}
            </a>
          </div>
        </header>
        <div className="content-base">{children}</div>
      </body>
    </html>
  );
}

export function ServerNotFound() {
  return (
    <ServerSimpleLayout>
      <div className="h1h4Page middle">
        <h1>404 not found</h1>
        <h4>ページが見つかりませんでした</h4>
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
