import { MultiParserWithMedia } from "./MultiParserWithMedia";
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
    return (
      <MultiParserWithMedia markdown linkPush linkSame hashtag {...args}>
        {data[name]}
      </MultiParserWithMedia>
    );
  } else {
    return null;
  }
}
