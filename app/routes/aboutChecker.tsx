import type { Route } from "./+types/aboutChecker";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";
import { useFetcher } from "react-router";
import { IsLogin } from "~/components/utils/Admin";
import { getCfEnv } from "~/data/cf/getEnv";
import { useIsLogin } from "~/components/state/EnvState";

export function meta({ matches }: Route.MetaArgs) {
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title: "アカウントチェッカー",
    description: import.meta.env.VITE_OWNER + "のアカウントチェック",
  });
}

interface actionResult {
  status: "success" | "error";
  message?: string;
  link?: string;
}

const KV_KEY = import.meta.env.VITE_KV_KEY_CHECK_ACCOUNT;
async function GetRegister(
  env: Partial<Env>,
): Promise<{ [k: string]: string[] } | null> {
  const registerString = await env.KV?.get(KV_KEY);
  return registerString ? JSON.parse(registerString) : null;
}

type defaultHostType =
  | "𝕏 (Twitter)"
  | "Bluesky"
  | "Instagram"
  | "Pixiv"
  | "YouTube";

export async function action(props: Route.ActionArgs) {
  const env = getCfEnv({ context: props.context })!;
  let status = 200;
  const formData = await props.request.formData();
  const result: actionResult = { status: "success" };
  if (props.request.method === "DELETE") {
    if (await IsLogin(props)) {
      const host = formData.get("host") as string;
      const user = formData.get("user") as string;
      if (env.KV && host && user) {
        const register = (await GetRegister(env)) || {};
        if (register[host]) {
          register[host] = register[host].filter((v) => v !== user);
          if (register[host].length === 0) delete register[host];
        }
        await env.KV.put(KV_KEY, JSON.stringify(register));
      }
      result.message = `${host}: ${user} deleted!`;
    } else {
      result.status = "error";
      result.message = "403 Forbidden";
      status = 403;
    }
  } else if (props.request.method === "PATCH") {
    if (await IsLogin(props)) {
      if (formData.has("before-host")) {
        const host = formData.get("host") as string;
        const beforeHost = formData.get("before-host") as string;
        if (env.KV && host) {
          const register = (await GetRegister(env)) || {};
          if (!register[host] || register[host].length === 0) {
            register[host] = register[beforeHost];
            delete register[beforeHost];
            if (register[host].length === 0) delete register[host];
            await env.KV.put(KV_KEY, JSON.stringify(register));
            result.message = `${beforeHost} -> ${host}: changed!`;
          } else {
            result.message = `${host} is exists!`;
            result.status = "error";
          }
        }
      }
    }
    if (!result.message) {
      result.status = "error";
      result.message = "403 Forbidden";
      status = 403;
    }
  } else if (formData.has("admin")) {
    if ((await IsLogin(props)) && env.KV) {
      const register = (await GetRegister(env)) || {};
      const host = formData.get("host") as string;
      let user = formData.get("user") as string;
      if (host && user) {
        if (user.startsWith("https://")) {
          const url = new URL(user);
          const m = url.pathname.match(/([^\/]+)\/?$/);
          if (m) user = m[1];
          else user = url.pathname;
        }
        if (register[host]) {
          register[host].push(user);
        } else {
          register[host] = [user];
        }
        register[host] = Array.from(new Set(register[host]));
        result.message = `${host}: ${user} added!`;
      }
      await env.KV.put(KV_KEY, JSON.stringify(register));
    } else {
      result.status = "error";
      result.message = "403 Forbidden";
      status = 403;
    }
  } else {
    const register = await GetRegister(env);
    if (register) {
      const host = formData.get("host") as string;
      const user = formData.get("user") as string;
      if (host && user) {
        if (register[host]?.some((v) => v === user)) {
          result.message = `[ ${host}: ${user} ] は ${import.meta.env.VITE_OWNER}のアカウントです！`;
          switch (host as defaultHostType) {
            case "𝕏 (Twitter)":
              result.link = `https://x.com/${user}`;
              break;
            case "Bluesky":
              result.link = `https://bsky.app/profile/${user}`;
              break;
            case "Instagram":
              result.link = `https://www.instagram.com/${user}`;
              break;
            case "Pixiv":
              result.link = `https://www.pixiv.net/users/${user}`;
              break;
            case "YouTube":
              result.link = `https://www.youtube.com/${user}`;
              break;
          }
        } else {
          result.message = `[ ${host}: ${user} ] は ${import.meta.env.VITE_OWNER}のアカウントではありません！`;
          result.status = "error";
        }
      } else if (host) {
        result.message = "ユーザーIDが未指定です";
      } else if (user) {
        result.message = "ホストが未指定です";
      } else {
        result.message = "ホストとユーザーIDが未指定です";
      }
    } else {
      result.status = "error";
      result.message = "レジスターの登録がありません";
      status = 403;
    }
  }
  return Response.json(result, { status });
}

interface loaderDataType {
  hosts: string[];
  register?: {
    [k: string]: string[];
  };
}
export async function loader(props: Route.LoaderArgs): Promise<loaderDataType> {
  const env = getCfEnv({ context: props.context })!;
  const register = (await GetRegister(env)) || {};
  const defaultHostList: defaultHostType[] = [
    "𝕏 (Twitter)",
    "Bluesky",
    "Instagram",
    "Pixiv",
    "YouTube",
  ];
  const isLogin = await IsLogin(props);
  if (isLogin) {
    return {
      hosts: Array.from(
        new Set((defaultHostList as string[]).concat(Object.keys(register))),
      ),
      register,
    };
  } else {
    return { hosts: Object.keys(register) };
  }
}

let loaderData: loaderDataType | undefined;
let loaderDataReload: boolean = true;
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  if (loaderDataReload || !loaderData) {
    loaderDataReload = false;
    loaderData = await serverLoader();
  }
  return loaderData;
}

export default function Page(props: Route.ComponentProps) {
  const isLogin = useIsLogin()[0];
  return (
    <div className="accountCheckerPage">
      <h1 className="color-dark">
        {import.meta.env.VITE_OWNER}のアカウントチェッカー
      </h1>
      <AccountChecker {...props} />
      {isLogin ? <AccountCheckerAdmin {...props} /> : null}
    </div>
  );
}

function AccountChecker(props: Route.ComponentProps) {
  const fetcher = useFetcher<actionResult>({ key: "admin" });
  return (
    <>
      <fetcher.Form method="post">
        <select name="host">
          {props.loaderData.hosts.map((host, i) => (
            <option key={i} value={host}>
              {host}
            </option>
          ))}
        </select>
        <input type="text" name="user" placeholder="確認したいユーザーID" />
        <button type="submit" className="color">
          確認する
        </button>
      </fetcher.Form>
      <p className={fetcher.data?.status === "error" ? "color-warm" : ""}>
        {fetcher.data?.message}
      </p>
      <p>
        {fetcher.data?.link ? (
          <a href={fetcher.data.link} target="_blank" className="external">
            {fetcher.data.link}
          </a>
        ) : null}
      </p>
    </>
  );
}

function AccountCheckerAdmin(props: Route.ComponentProps) {
  const fetcher = useFetcher<actionResult>();
  return (
    <>
      <h4>各種アカウント情報の追加</h4>
      <fetcher.Form
        method="post"
        onSubmit={() => {
          loaderDataReload = true;
        }}
      >
        <input type="hidden" name="admin" />
        <input
          type="text"
          name="host"
          list="accountHostRegistDataList"
          placeholder="ホスト名"
        />
        <input type="text" name="user" placeholder="ユーザーID" />
        <datalist id="accountHostRegistDataList">
          {props.loaderData.hosts.map((host, i) => (
            <option key={i} value={host}>
              {host}
            </option>
          ))}
        </datalist>
        <button type="submit" className="color">
          追加
        </button>
      </fetcher.Form>
      <p className={fetcher.data?.status === "error" ? "color-warm" : ""}>
        {fetcher.data?.message}
      </p>
      <h4>登録済みのアカウント</h4>
      <ul>
        {props.loaderData.hosts.map((host, i) => (
          <li key={i}>
            <fetcher.Form
              method="patch"
              onSubmit={() => {
                loaderDataReload = true;
              }}
            >
              <input name="host" placeholder={host} defaultValue={host} />
              <input type="hidden" name="before-host" value={host} />
              <button>名前変更</button>
            </fetcher.Form>
            {props.loaderData.register?.[host] ? (
              <ul>
                {props.loaderData.register[host].map((user, i) => (
                  <li key={i}>
                    <fetcher.Form
                      method="delete"
                      onSubmit={(e) => {
                        if (confirm(`${host}: ${user}\n本当に削除しますか？`)) {
                          loaderDataReload = true;
                        } else {
                          e.preventDefault();
                        }
                      }}
                    >
                      <span>{user}</span>
                      <input type="hidden" name="host" value={host} />
                      <input type="hidden" name="user" value={user} />
                      <button className="color-warm ml-2">削除</button>
                    </fetcher.Form>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
