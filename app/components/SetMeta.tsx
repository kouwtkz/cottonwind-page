interface LoaderEnv {
  title?: string;
  description?: string;
}

export function SetLoaderEnv(env: Partial<Env>): LoaderEnv {
  return { title: env.TITLE, description: env.DESCRIPTION };
}

export type MetaValuesType =
  | { title: string }
  | { name: string; content: string };

interface SetMetaBaseProps {
  data?: LoaderEnv;
}
interface SetMetaProps extends SetMetaBaseProps {
  title?: string;
  description?: string;
}

export function SetMetaDefault({
  title,
  description,
  data,
}: SetMetaProps): MetaValuesType[] {
  const list: MetaValuesType[] = [];
  SetMetaTitle({ title, data }).forEach((v) => {
    list.push(v);
  });
  description = description || data?.description;
  if (description) list.push({ name: "description", content: description });
  return list;
}

interface SetMetaTitleProps extends SetMetaBaseProps {
  title?: string;
}
export function SetMetaTitle({ title = "", data }: SetMetaTitleProps) {
  const list: MetaValuesType[] = [];
  const siteTitle = data?.title || "";
  const rightTitle = title && siteTitle ? " - " + siteTitle : siteTitle;
  title = title + rightTitle;
  if (title) {
    list.push({ title });
    list.push({ name: "og:title", content: title });
  }
  return list;
}
