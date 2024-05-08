import { Buffer } from 'buffer'

const OAUTH2_AUTHRIZE = 'https://twitter.com/i/oauth2/authorize';
const OAUTH2_ACCESSTOKEN = 'https://api.twitter.com/2/oauth2/token';
const OAUTH2_REVOKETOKEN = 'https://api.twitter.com/2/oauth2/revoke';
const END_POINT = 'https://api.twitter.com/2/tweets';
const END_POINT_USER_ME = 'https://api.twitter.com/2/users/me';

export function generateRandomStr(l = 0) {
  // 生成する文字列に含める文字セット
  var c = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var cl = c.length;
  var r = "";
  for (var i = 0; i < l; i++) {
    r += c[Math.floor(Math.random() * cl)];
  }
  return r;
}

// パーセントエンコード化（RFC3986）
export function encodeRFC3986(text: string) {
  let encodedText = encodeURIComponent(text);
  const encoders: { [k: string]: string } = {
    '!': '%21',
    "'": '%27',
    '(': '%28',
    ')': '%29',
    '*': '%2A'
  }
  for (let key in encoders) {
    encodedText = encodedText.replaceAll(key, encoders[key]);
  }
  return encodedText;
}

export function getOauth2AuthorizeUrl(
  { client_id, redirect_uri, scopes = ["tweet.read", "tweet.write", "users.read", "offline.access"],
    state = generateRandomStr(42), code_challenge, code_challenge_method = "plain" }
    : { client_id: string, scopes?: TweetScope[], state?: string, redirect_uri: string, code_challenge: string, code_challenge_method?: string }) {
  const oauth2_auth_options =
  {
    response_type: "code",
    client_id,
    redirect_uri,
    scope: scopes.join(" "),
    state,
    code_challenge,
    code_challenge_method
  }
  return OAUTH2_AUTHRIZE + "?" + Object.entries(oauth2_auth_options).map(([k, v]) => `${k}=${encodeRFC3986(v)}`).join("&")
}

export function getBasicAuthorization({ client_id, client_secret }: { client_id: string, client_secret: string }) {
  return toBase64(`${client_id}:${client_secret}`);
}

export function toBase64(str: string) {
  return Buffer.from(str).toString("base64");
}

export async function getUserMe({ access_token }: { access_token: string }) {
  return await fetch(END_POINT_USER_ME, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + access_token
    },
  });
}

export function PostTwix({ text, access_token }: { text: string, access_token: string }) {
  const options = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token
    },
    method: "POST",
    body: JSON.stringify({ text })
  } as RequestInit;
  return fetch(END_POINT, options);
}

export async function getAccessToken(
  { code, client_id, basicAuthorization, redirect_uri, code_verifier }
    : { code: string, client_id: string, basicAuthorization: string, redirect_uri: string, code_verifier: string }) {
  const oauth2_access_options =
  {
    code,
    grant_type: "authorization_code",
    redirect_uri,
    client_id,
    code_verifier,
    response_type: "code",
  }
  const r = await fetch(OAUTH2_ACCESSTOKEN + "?" + Object.entries(oauth2_access_options).map(([k, v]) => `${k}=${encodeRFC3986(v)}`).join("&"), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + basicAuthorization,
    },
    method: "POST",
  });
  if (r.status === 200) {
    return await r.json() as responseTokenType;
  } else return null;
}

export async function PutKvToken(
  { name = "token", kv, user, responseToken }:
    { name?: string, kv: KVNamespace, user?: TwitterUserType, responseToken: responseTokenType }) {
  if (!user && responseToken.access_token) {
    const r = await getUserMe({ access_token: responseToken.access_token });
    if (r.status === 200) user = (await r.json() as responseUserType).data;
  }
  const token = {
    ...responseToken,
    limit: Date.now() + (responseToken.expires_in || 0) * 1000,
    user
  } as kvTokenType;
  await kv.put(name, JSON.stringify(token));
  return token;
}
export async function GetKvToken({ name = "token", kv }: { name?: string, kv: KVNamespace }) {
  const tokenStr = await kv.get(name);
  const token = tokenStr ? (JSON.parse(tokenStr) as kvTokenType) : null;
  return token;
}
export function DeleteKvToken({ name = "token", kv }: { name?: string, kv: KVNamespace }) {
  return kv.delete(name);
}

export async function SetAccessToken(
  { env, code, code_verifier, client_id, redirect_uri, basicAuthorization }
    : { env: MeeEnv, code: string, client_id: string, redirect_uri: string, code_verifier: string, basicAuthorization: string }) {
  const responseToken = await getAccessToken({
    code,
    client_id,
    basicAuthorization,
    code_verifier,
    redirect_uri,
  });
  if (responseToken) {
    return await PutKvToken({ kv: env.NOTICE_FEED_KV, responseToken })
  } else return null;
}

export async function RefreshAccessToken(
  { env, refresh_token, user, client_id, basicAuthorization }
    : { env: MeeEnv, refresh_token: string, user?: TwitterUserType, client_id: string, basicAuthorization: string }) {
  const oauth2_access_options =
  {
    refresh_token,
    grant_type: "refresh_token",
    client_id
  }
  const r = await fetch(OAUTH2_ACCESSTOKEN + "?" + Object.entries(oauth2_access_options).map(([k, v]) => `${k}=${encodeRFC3986(v)}`).join("&"), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + basicAuthorization,
    },
    method: "POST",
  });
  if (r.status === 200) {
    const responseToken = await r.json() as responseTokenType;
    const token = await PutKvToken({ kv: env.NOTICE_FEED_KV, user, responseToken })
    return token;
  } else {
    await DeleteKvToken({ kv: env.NOTICE_FEED_KV });
    return null;
  }
}

export async function SyncToken(env: MeeEnv) {
  const kv: KVNamespace = env.NOTICE_FEED_KV;
  const token = await GetKvToken({ kv })
  if (token?.limit) {
    if (token.limit < Date.now()) {
      if (token.refresh_token) {
        const client_id = env.X_CLIENT_ID as string;
        const basicAuthorization = getBasicAuthorization({
          client_id,
          client_secret: env.X_CLIENT_SECRET as string,
        });
        return await RefreshAccessToken({ env, refresh_token: token.refresh_token, user: token.user, basicAuthorization, client_id });
      }
    }
  }
  return token;
}

export async function RevokeToken({ env, token, token_type_hint = "access_token", basicAuthorization }: { env: MeeEnv, token: string, token_type_hint?: "access_token" | "refresh_token", basicAuthorization: string }) {
  const oauth2_access_options = { token, token_type_hint };
  await DeleteKvToken({ kv: env.NOTICE_FEED_KV });
  return await fetch(OAUTH2_REVOKETOKEN + "?" + Object.entries(oauth2_access_options).map(([k, v]) => `${k}=${encodeRFC3986(v)}`).join("&"), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + basicAuthorization,
    },
    method: "POST",
  }).then(r => r.json()) as responseTokenType
}

export async function PostTest({ text, token }: PostTestProps) {
  if (token?.access_token) {
    return PostTwix({ text, access_token: token.access_token });
  } else return null;
}