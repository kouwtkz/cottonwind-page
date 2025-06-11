import type { OmittedEnv } from "types/custom-configuration";
import { concatOriginUrl } from "../functions/originUrl";

export type MetaValuesType =
  | { title: string }
  | { name: string; content: string };

export interface SetMetaBaseProps {
  env?: Partial<OmittedEnv>;
}
export interface SetRootProps extends SetMetaBaseProps {
  title?: string;
  description?: string;
  image?: ImageDataType | string | null;
  apiOrigin?: string;
  mediaOrigin?: string;
  isLogin?: boolean;
  isComplete?: boolean;
}

interface rootClientServerDataType {
  data: SetRootProps | null;
}
export const rootClientServerData: rootClientServerDataType = { data: null };

export function SetMetaDefault({
  title,
  description,
  env,
  mediaOrigin,
  image,
}: SetRootProps): MetaValuesType[] {
  const list: MetaValuesType[] = [];
  SetMetaTitle({ title, env }).forEach((v) => {
    list.push(v);
  });
  description = description || env?.DESCRIPTION;
  if (description) list.push({ name: "description", content: description });
  if (image) {
    if (typeof image === "string") {
      list.push({ name: "og:image", content: image });
    } else {
      const imagePath = concatOriginUrl(mediaOrigin, image.src);
      list.push({ name: "og:image", content: imagePath });
    }
  }
  return list;
}

interface addSiteTitleProps extends SetMetaBaseProps {
  title?: string;
}
export function addSiteTitle({ title = "", env }: addSiteTitleProps) {
  const siteTitle = env?.TITLE || "";
  const rightTitle = title && siteTitle ? " | " + siteTitle : siteTitle;
  return title + rightTitle;
}
export function SetMetaTitle(props: addSiteTitleProps) {
  const list: MetaValuesType[] = [];
  const title = addSiteTitle(props);
  if (title) {
    list.push({ title });
    list.push({ name: "og:title", content: title });
  }
  return list;
}
