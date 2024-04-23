import { SnsList } from "./components/layout/Footer";
import { Loading } from "./components/layout/Loading";
import { SetMeta, SetMetaProps } from "./routes/SetMeta";
import { serverSite as site } from "./data/server/site";
import { CommonContext } from "./types/HonoCustomType";
import { parseImageItems } from "./data/functions/images";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
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
  const Url = new URL(url);
  const isBot = /http|bot|spider\/|facebookexternalhit/i.test(
    c.req.header("user-agent") ?? ""
  );
  let {
    images,
  }: {
    images?: MediaImageItemType[];
  } = {};
  if (isBot && Url.searchParams.has("image")) {
    const dataPath = "/static/data";
    const r_images = await fetch(Url.origin + dataPath + "/images.json");
    images = judgeJson(r_images)
      ? parseImageItems(await r_images.json())
      : undefined;
  }
  let current = 0,
    month = 0,
    total = 0;
  if (!isBot) {
    const kv: KVNamespace = (c.env as any).KV;
    const count = JSON.parse((await kv.get("count")) || "{}");
    current = Number(getCookie(c, "count")) || 0;
    month = Number(count.month || 0);
    total = Number(count.total || 0);
    if (!current) {
      month++;
      total++;
      await kv.put("count", JSON.stringify({ month, total }));
      current = month;
      const today = new Date();
      const expires = new Date(today.getFullYear() + "-1-1");
      expires.setMonth(today.getMonth() + 1);
      expires.setMilliseconds(-1);
      setCookie(c, "count", String(current), { expires });
    }
  }
  return (
    <html lang="ja">
      <head>
        <DefaultMeta />
        <script
          id="accessCountData"
          data-current={current}
          data-month={month}
          data-total={total}
        />
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
