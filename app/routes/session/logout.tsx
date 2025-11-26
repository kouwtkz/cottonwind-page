import type { Route } from "./+types/logout";
import { destroySession, getSession } from "~/sessions.server";
import { dbClass } from "~/data/ClientDBLoader";
import { useEffect } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  return new Response(null, {
    status: 202,
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export default function Page() {
  useEffect(() => {
    try {
      dbClass.deleteDatabase();
    } catch {}
    location.href = "/login";
  });
  return (
    <div className="flex middle">
      <span>ログアウト中…</span>
    </div>
  );
}
