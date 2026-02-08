import type { Route } from "./+types/blog";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import { BlogPage } from "~/page/BlogPage";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";
import { parse } from "marked";
import { getCfDB } from "~/data/cf/getEnv";
import { postTableObject } from "./api/blog";
import { postsDataIndexed, waitIdb } from "~/data/ClientDBLoader";
import { FormatDate } from "~/components/functions/DateFunction";

export async function loader({ context, request }: Route.LoaderArgs) {
  const db = getCfDB({ context });
  const Url = new URL(request.url);
  const postId = Url.searchParams.get("postId");
  let post: PostDataType | null | undefined;
  if (db && postId) {
    post = await postTableObject
      .Select({ db, where: { postId } })
      .then((c) => c[0]);
  }
  return { post };
}

let clientServerData: {
  post?: PostDataType | null;
} = {};
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await waitIdb;
  const Url = new URL(request.url);
  const postId = Url.searchParams.get("postId");
  if (postId) {
    if (clientServerData.post?.postId !== postId) {
      clientServerData.post = await postsDataIndexed.table
        .get({
          index: "postId",
          query: postId,
        })
        .then((v) => v?.rawdata);
    }
  } else clientServerData.post = null;
  return clientServerData;
}
clientLoader.hydrate = true;

export function meta({ matches, data, location }: Route.MetaArgs) {
  const metaData = { ...getDataFromMatches(matches)?.data };
  const post = data?.post;
  metaData.title = "ブログ";
  if (post) {
    metaData.title =
      (post.title ||
        (post.time
          ? FormatDate(new Date(post.time), "Y-n-j")
          : String(post.id))) +
      " - " +
      metaData.title;
    const parsed = String(parse(post.body || "", { async: false }))
      .replace(/\<.+\>/g, "")
      .replace(/\s+/g, " ");
    let sliced = parsed.slice(0, 300);
    if (parsed.length > sliced.length) sliced = sliced + "…";
    metaData.description = sliced;
  } else {
    metaData.description = "わたかぜコウのサイト内ブログ";
  }

  return SetMetaDefault(metaData);
}

export default function Page() {
  return <BlogPage />;
}
