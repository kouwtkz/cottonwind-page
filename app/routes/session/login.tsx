import { getCfEnv } from "~/data/cf/getEnv";
import type { Route } from "./+types/login";
import { dbClass, waitIdb } from "~/data/ClientDBLoader";
import { envAsync } from "~/data/ClientEnvLorder";
import { SetMetaDefault, type SetRootProps } from "~/components/utils/SetMeta";
import { Form, redirect } from "react-router";
import { commitSession, getSession } from "~/sessions.server";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";

export async function loader({ context }: Route.LoaderArgs) {
  return { env: getCfEnv({ context }) };
}
export async function clientLoader({}: Route.ClientLoaderArgs) {
  await waitIdb;
  return { env: await envAsync } as SetRootProps;
}
clientLoader.hydrate = true;

export function meta({ matches }: Route.MetaArgs) {
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title: "ログイン",
  });
}

function getRedirectUrl(request: Request) {
  const Url = new URL(request.url);
  let redirectUrl =
    Url.searchParams.get("redirect") || request.headers.get("referer") || "";
  if (!redirectUrl || /login/.test(redirectUrl)) redirectUrl = "/";
  return redirectUrl;
}

type ResponseType = { type: "success" | "error"; message: string };

export async function action({ request, context }: Route.ActionArgs) {
  const env = getCfEnv({ context });
  const session = await getSession(request.headers.get("Cookie"));
  const form = await request.formData();
  const password = form.get("password");
  if (password) {
    if (password === env?.LOGIN_TOKEN) {
      session.set("LoginToken", password as string);
      return Response.json(
        { type: "success", message: getRedirectUrl(request) } as ResponseType,
        {
          status: 200,
          headers: {
            "Set-Cookie": await commitSession(session),
          },
        }
      );
    } else {
      return Response.json(
        {
          type: "error",
          message: "パスワードが間違ってます！",
        } as ResponseType,
        { status: 401 }
      );
    }
  } else
    return Response.json(
      {
        type: "error",
        message: "パスワードが入力されていません！",
      } as ResponseType,
      { status: 401 }
    );
}

export async function clientAction({ serverAction }: Route.ClientActionArgs) {
  const action = serverAction();
  action.then(({ type, message }: ResponseType) => {
    if (type === "success") {
      try {
        dbClass.deleteDatabase();
        dbClass.close();
      } catch {}
      location.href = message;
    }
  });
  return action;
}

interface PageProps extends Omit<Route.ComponentProps, "actionData"> {
  actionData: ResponseType | null;
}
export default function Page({ actionData }: PageProps) {
  const message = actionData?.type === "error" ? actionData.message : "";
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
        {message ? <div className="color-warm">{message}</div> : null}
        <button className="color" type="submit">
          送信
        </button>
      </Form>
    </div>
  );
}
