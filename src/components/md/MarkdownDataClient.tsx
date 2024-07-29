import MultiParser from "@/functions/doc/MultiParser";
import { useMarkdownDataState } from "./MarkdownDataState";

export function MdClientNode({
  name,
  ...args
}: {
  name: string;
  className?: string;
  parsedClassName?: string;
}) {
  const { data } = useMarkdownDataState();
  if (data && data[name]) {
    return <MultiParser {...args}>{data[name]}</MultiParser>;
  } else {
    return null;
  }
}
