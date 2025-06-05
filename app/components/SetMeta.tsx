import type { OmittedEnv } from "types/custom-configuration";
import type { SetRootProps } from "~/data/rootData";

export type MetaValuesType =
  | { title: string }
  | { name: string; content: string };

export interface SetMetaBaseProps {
  env?: Partial<OmittedEnv>;
}

export function SetMetaDefault({
  title,
  description,
  env,
}: SetRootProps): MetaValuesType[] {
  const list: MetaValuesType[] = [];
  SetMetaTitle({ title, env }).forEach((v) => {
    list.push(v);
  });
  description = description || env?.DESCRIPTION;
  if (description) list.push({ name: "description", content: description });
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
