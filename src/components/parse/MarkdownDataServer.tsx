import { MultiParser } from "./MultiParser";
import { GetMarkdownData } from "./MarkdownData.mjs";

export function MdServerNode({
  name,
  ...args
}: {
  name: string;
  className?: string;
  parsedClassName?: string;
}) {
  const data = GetMarkdownData(name);
  if (data) return <MultiParser {...args}>{data}</MultiParser>;
  else return null;
}
