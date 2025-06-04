export type MetaValuesType =
  | { title: string }
  | { name: string; content: string };

interface SetMetaBaseProps {
  env?: Partial<Env>;
}
export interface SetMetaProps extends SetMetaBaseProps {
  title?: string;
  description?: string;
}

export function SetMetaDefault({
  title,
  description,
  env,
}: SetMetaProps): MetaValuesType[] {
  const list: MetaValuesType[] = [];
  SetMetaTitle({ title, env }).forEach((v) => {
    list.push(v);
  });
  description = description || env?.DESCRIPTION;
  if (description) list.push({ name: "description", content: description });
  return list;
}

interface SetMetaTitleProps extends SetMetaBaseProps {
  title?: string;
}
export function SetMetaTitle({ title = "", env }: SetMetaTitleProps) {
  const list: MetaValuesType[] = [];
  const siteTitle = env?.TITLE || "";
  const rightTitle = title && siteTitle ? " - " + siteTitle : siteTitle;
  title = title + rightTitle;
  if (title) {
    list.push({ title });
    list.push({ name: "og:title", content: title });
  }
  return list;
}
