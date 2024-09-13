import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { renderHtml } from "@/functions/render";
import { WorkersLayout } from "..";
import {
  SyncToken,
  SetAccessToken,
  PostTest,
  RevokeToken,
  getBasicAuthorization,
  getOauth2AuthorizeUrl,
  generateRandomStr,
  RefreshAccessToken,
  getUserMe,
} from "./twix";

const app = new Hono<MeePagesBindings>();

app.post("/", async (c) => {
  const token = await SyncToken(c.env);
  const body = await c.req.parseBody();
  if (typeof body.post === "string") {
    await PostTest({ text: body.post, token });
    return c.redirect("/workers/twix");
  }
});

app.get("/", async (c) => {
  const Url = new URL(c.req.url);
  const query = c.req.query() as { [k in string]: string };
  if ("authorize" in query) {
    const code_challenge = generateRandomStr(42);
    const state = generateRandomStr(42);
    const redirect_uri = Url.origin + Url.pathname;
    console.log(redirect_uri);
    setCookie(c, "twitter_code_verifier", code_challenge);
    setCookie(c, "twitter_code_state", state);
    return c.redirect(
      getOauth2AuthorizeUrl({
        client_id: c.env.X_CLIENT_ID ?? "",
        redirect_uri,
        state,
        code_challenge,
      })
    );
  }
  if (query.code) {
    const code_verifier = getCookie(c, "twitter_code_verifier");
    const state = getCookie(c, "twitter_code_state");
    const redirect_uri = Url.origin + Url.pathname;
    if (code_verifier && state === query.state) {
      const client_id = c.env.X_CLIENT_ID ?? "";
      const basicAuthorization = getBasicAuthorization({
        client_id,
        client_secret: c.env.X_CLIENT_SECRET ?? "",
      });
      await SetAccessToken({
        env: c.env,
        code: query.code,
        client_id,
        redirect_uri,
        code_verifier,
        basicAuthorization,
      });
    }
    if (code_verifier) deleteCookie(c, "twitter_code_verifier");
    if (state) deleteCookie(c, "twitter_code_state");
    return c.redirect("/workers/twix");
  }
  const token = await SyncToken(c.env);
  if (token?.access_token && "refresh" in query) {
    const client_id = c.env.X_CLIENT_ID ?? "";
    if (token?.refresh_token) {
      await RefreshAccessToken({
        env: c.env,
        refresh_token: token.refresh_token,
        user: token.user,
        client_id,
        basicAuthorization: getBasicAuthorization({
          client_id,
          client_secret: c.env.X_CLIENT_SECRET ?? "",
        }),
      });
    }
    return c.redirect(c.req.header("referer") ?? "/");
  }
  if (token?.access_token && "revoke" in query) {
    await RevokeToken({
      env: c.env,
      token: token?.access_token,
      basicAuthorization: getBasicAuthorization({
        client_id: c.env.X_CLIENT_ID ?? "",
        client_secret: c.env.X_CLIENT_SECRET ?? "",
      }),
    });
    return c.redirect(c.req.header("referer") ?? "/");
  }
  return c.html(
    renderHtml(
      <WorkersLayout
        title="めぇめぇTwitterれんけい"
        script={
          <script
            type="module"
            src={
              import.meta.env?.DEV
                ? "/src/workers/twix/twixClient.tsx"
                : "/static/js/twixClient.js"
            }
          />
        }
      >
        <p>
          <span>{token?.access_token ? "ログイン中" : "未ログイン"}</span>
          {token?.user ? (
            <span>
              : {token?.user?.name}(
              <a
                href={"https://twitter.com/" + token?.user?.username}
                target="twitter"
              >
                {token?.user?.username}
              </a>
              )
            </span>
          ) : null}
          {token ? (
            <div
              id="copyArea"
              className="pointer"
              data-token={token?.access_token}
            >
              アクセストークンのコピー
            </div>
          ) : null}
        </p>
        {token?.access_token ? (
          <form className="inline-block" method="post">
            <p>
              <label>
                <span>投稿テスト:</span>
                <textarea name="post" />
              </label>
            </p>
            <p>
              <button type="submit">送信する</button>
            </p>
          </form>
        ) : null}
        {token?.access_token ? (
          <ul className="inline-block flex center column large">
            <li>
              <a href="?refresh">twitter連携を更新する</a>
            </li>
            <li>
              <a href="?revoke">twitter連携を解除する</a>
            </li>
          </ul>
        ) : (
          <div className="flex center column large">
            <a href="?authorize">twitter連携をする</a>
          </div>
        )}
        <div id="app" />
        <div className="flex center column large">
          <a href="/workers/notice-feed">めぇめぇつうしんへもどる</a>
          <a href="/workers">ワーカーページにもどる</a>
        </div>
      </WorkersLayout>
    )
  );
});

export const app_twix = app;
