import { Hono, Next } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { CommonContext } from "./types/HonoCustomType";
import { renderHtml } from "./functions/render";
import { ServerSimpleLayout } from "./serverLayout";
import { redirect } from "react-router-dom";

export function IsLogin<T extends MeeCommonEnv>(
  c: CommonContext<T>,
  trueWhenDev = false
) {
  if (trueWhenDev && import.meta.env?.DEV) return import.meta.env.DEV;
  return c.env?.LOGIN_TOKEN === getCookie(c, "LoginToken");
}

export function SetLoginCookieProcess<T extends MeeCommonEnv>(
  c: CommonContext<T>
) {
  const Url = new URL("/", request.url);
  setCookie(c, "LoginToken", String(c.env?.LOGIN_TOKEN), {
    maxAge: 32e6,
    domain: Url.hostname,
  });
}

export function LoginRoute<T extends MeeCommonEnv>() {
  function LoginPage({
    message,
    redirect,
  }: {
    message?: string;
    redirect?: string | null;
  }) {
    return (
      <ServerSimpleLayout noindex={true} className="h1h4Page">
        <h1 className="color-main">めぇのログインページ</h1>
        <form method="POST" className="flex center column font-larger workers">
          <input
            name="password"
            type="password"
            title="パスワード（ログイントークン）"
            placeholder="パスワード"
          />
          {redirect ? (
            <input type="hidden" name="redirect" value={redirect} />
          ) : null}
          {message ? <div className="warm">{message}</div> : null}
          <button className="color" type="submit">
            送信
          </button>
        </form>
      </ServerSimpleLayout>
    );
  }
  const app = new Hono<MeeBindings<T>>();
  app.get("/", (c) => {
    const Url = new URL(request.url);
    const redirect =
      Url.searchParams.get("redirect") || request.header("referer") || "/";
    if (import.meta.env?.DEV) {
      SetLoginCookieProcess(c);
      return c.redirect(redirect);
    }
    return c.html(renderHtml(<LoginPage redirect={redirect} />));
  });
  app.post("/", async (c) => {
    const formData = await request.formData();
    const redirect = formData.get("redirect") as string | null;
    if (formData.get("password") === c.env?.LOGIN_TOKEN) {
      SetLoginCookieProcess(c);
      return c.redirect(redirect || "/");
    } else {
      return c.html(
        renderHtml(
          <LoginPage message="パスワードが間違ってます！" redirect={redirect} />
        ),
        { status: 403 }
      );
    }
  });
  return app;
}

export async function LoginCheckMiddleware<T extends MeeCommonEnv>(
  c: CommonContext<T>,
  next: Next
) {
  const isLogin = IsLogin(c);
  if (isLogin) return next();
  else {
    if (request.method === "GET") {
      const Url = new URL("/workers/login", request.url);
      Url.searchParams.set("redirect", request.url);
      return redirect(Url.href);
    } else return c.text("403 Forbidden", 403);
  }
}

export function LogoutProcess<T extends MeeCommonEnv>(c: CommonContext<T>) {
  const Url = new URL("/", request.url);
  deleteCookie(c, "LoginToken", { domain: Url.hostname });
}
export function Logout<T extends MeeCommonEnv>(
  c: CommonContext<T>,
  redirect = "/"
) {
  LogoutProcess(c);
  return c.redirect(redirect);
}
