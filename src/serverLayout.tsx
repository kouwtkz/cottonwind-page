import { SnsList } from "./components/layout/Footer";
import { Loading } from "./components/layout/Loading";
import { SetMeta, SetMetaProps } from "./routes/SetMeta";
import { serverSite as site } from "./data/server/site";
import { HonoRequest } from "hono";
import { serverConfig } from "./data/server/config";
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

export async function discordInviteMatch(req: HonoRequest<string, any>) {
  return serverConfig.discordInvite &&
    (await req.json()).invite_password === serverConfig.discordInvitePassword
    ? serverConfig.discordInvite
    : null;
}
