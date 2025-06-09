import { getCfDB, getCfEnv } from "~/data/cf/getEnv";
import type { Route } from "./+types/blogRss";
import { ServerPostsGetRssData } from "./api/blog";
import { MakeRss } from "~/components/functions/doc/GenerateRss";

export async function loader({ context, request }: Route.LoaderArgs) {
  const db = getCfDB({ context });
  const env = getCfEnv({ context });
  if (db && env) {
    const postsData = await ServerPostsGetRssData(db, 10);
    return new Response(
      await MakeRss({
        env,
        db,
        postsData,
        url: request.url,
      }),
      {
        headers: {
          "Content-Type": "application/xml",
        },
      }
    );
  } else return new Response();
}
