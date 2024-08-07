import { MultiParserWithMedia } from "@/functions/doc/MultiParserWithMedia";
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
    return <MultiParserWithMedia {...args}>{data[name]}</MultiParserWithMedia>;
  } else {
    return null;
  }
}
