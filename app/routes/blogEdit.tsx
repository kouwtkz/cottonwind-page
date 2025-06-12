import type { Route } from "./+types/blogEdit";
import { SetMetaDefault } from "~/components/utils/SetMeta";
import { PostForm } from "~/page/edit/PostForm";
import { getDataFromMatches } from "~/components/utils/RoutesUtils";

export function meta({ matches }: Route.MetaArgs) {
  return SetMetaDefault({
    ...getDataFromMatches(matches)?.data,
    title: "ブログの編集",
    description: "サイト内ブログの編集",
  });
}

export default function Page() {
  return <PostForm />;
}
