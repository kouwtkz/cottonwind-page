
interface ePubMetadataType {
  title?: string;
  creator?: string;
  description?: string;
  direction?: "rtl" | "ltr";
  pubdate?: string;
  publisher?: string;
  identifier?: string;
  language?: string;
  rights?: string;
  modified_date?: string;
  layout?: string;
  orientation?: string;
  flow?: string;
  viewport?: string;
  spread?: string;
}

type BookReaderMode = "bookReader" | "laymic";
type ViewerOrientationType = "vertical" | "horizontal";
type ViewerDirectionType = "rtl" | "ltr";

interface BookReaderStateType {
  list?: (string | Element)[] | null;
  orientation?: ViewerOrientationType;
  direction?: ViewerDirectionType;
  bookReaderMode?: BookReaderMode;
  enabled?: boolean;
}