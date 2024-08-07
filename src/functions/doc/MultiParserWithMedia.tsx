import { useImageState } from "@/state/ImageState";
import { MultiParser, MultiParserProps } from "./MultiParser";

interface MultiParserWithMediaProps
  extends Omit<MultiParserProps, "replaceFunctions"> {}

export function MultiParserWithMedia(args: MultiParserWithMediaProps) {
  const { imageObject } = useImageState();
  const { MultiParserReplaceImages } = imageObject;
  return MultiParser({
    ...args,
    replaceFunctions: MultiParserReplaceImages.bind(imageObject),
  });
}
