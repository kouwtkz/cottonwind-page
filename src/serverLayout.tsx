import { SnsList } from "./components/layout/Footer";
import { Loading } from "./components/layout/Loading";
import { SetMeta, SetMetaProps } from "./routes/SetMeta";
import { serverSite as site } from "./data/server/site";
import { CommonContext } from "./types/HonoCustomType";
import { parseImageItems } from "./data/functions/images";
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

export function DefaultBody() {
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
}: {
  c: CommonContext;
  characters?: CharaObjectType;
  meta: React.ReactNode;
}) {
  const url = c.req.url;
  const isBot = /http|bot|spider\/|facebookexternalhit/i.test(
    c.req.header("user-agent") ?? ""
  );
  let {
    images,
  }: {
    images?: MediaImageItemType[];
  } = {};
  if (isBot) {
    const Url = new URL(url);
    const dataPath = "/static/data";
    const r_images = await fetch(Url.origin + dataPath + "/images.json");
    images = judgeJson(r_images)
      ? parseImageItems(await r_images.json())
      : undefined;
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
      </head>
      <DefaultBody />
    </html>
  );
}
