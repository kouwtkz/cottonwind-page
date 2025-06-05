import { getCfEnv } from "~/data/cf/getEnv";
import type { Route } from "./+types/login";
import { waitIdb } from "~/data/ClientDBLoader";
import { envAsync } from "~/data/ClientEnvLorder";
import { SetMetaDefault } from "~/components/SetMeta";
import { rootClientServerData, type SetRootMetaProps } from "~/data/rootData";
import { matchesRoot } from "~/root";
import { Form, redirect, useLocation } from "react-router";
import { LocationToUrl } from "~/components/functions/doc/MakeURL";
import { useMemo } from "react";
import { commitSession, getSession } from "~/sessions.server";

export async function loader({ context }: Route.LoaderArgs) {
  return { env: getCfEnv({ context }) };
}
export async function clientLoader({}: Route.ClientLoaderArgs) {
  await waitIdb;
  return { env: await envAsync } as SetRootMetaProps;
}
clientLoader.hydrate = true;

interface MetaWithDataArgs extends Route.MetaArgs {
  data: SetRootMetaProps;
}
export function meta({ data, matches }: MetaWithDataArgs) {
  // console.log(matches);
  let title = "";
  return SetMetaDefault({ env: data?.env, title });
}

function redirectAction(request: Request, headers?: HeadersInit) {
  const Url = new URL(request.url);
  let redirectUrl =
    Url.searchParams.get("redirect") || request.headers.get("referer") || "";
  if (!redirectUrl || /login/.test(redirectUrl)) redirectUrl = "/";
  return redirect(redirectUrl, { headers });
}

export async function action({ request, context }: Route.ActionArgs) {
  const env = getCfEnv({ context });
  const session = await getSession(request.headers.get("Cookie"));
  const form = await request.formData();
  const password = form.get("password");
  if (password) {
    if (password === env?.LOGIN_TOKEN) {
      session.set("LoginToken", password as string);
      return redirectAction(request, {
        "Set-Cookie": await commitSession(session),
      });
    } else {
      return "パスワードが間違ってます！";
    }
  } else return "パスワードが入力されていません！";
}

export async function clientAction({ serverAction }: Route.ClientActionArgs) {
  const action = serverAction();
  action.catch((r: Response) => {
    if (r.status === 302 && rootClientServerData.data) {
      rootClientServerData.data.isLogin = true;
    }
  });
  return action;
}

export default function Page({ actionData }: Route.ComponentProps) {
  return (
    <div className="h1h4Page">
      <h1 className="color-main">めぇのログインページ</h1>
      <Form method="POST" className="flex center column font-larger workers">
        <input
          name="password"
          type="password"
          title="パスワード（ログイントークン）"
          placeholder="パスワード"
        />
        {actionData ? <div className="color-warm">{actionData}</div> : null}
        <button className="color" type="submit">
          送信
        </button>
      </Form>
    </div>
  );
}
