
interface Mochott_Profile extends ATBaseType<"site.mochott.profile"> {
  url: string;
  name: string;
  articles: string[];
  createdAt: string;
  description: string;
}

interface Mochott_Raw_Minisite extends ATBaseType<"site.mochott.minisite"> {
  name: string;
  slug: string;
  articles: string[];
  createdAt: string;
  designType: string;
  globalSlug: string;
  sourceType: string;
  accentColor: string;
  primaryColor: string;
  backgroundColor: string;
}
interface Mochott_Minisite extends Mochott_Raw_Minisite {
  domain?: string;
}

type Mochott_textAlign = "left" | "center" | "right";
type Mochott_Content_General_Union = Mochott_Content_Text | Mochott_Content_Paragraph
  | Mochott_Content_Heading | Mochott_Content_Image
  | Mochott_Content_HardBreak | Mochott_Content_HorizontalRule
  | Mochott_Content_BulletList | Mochott_Content_OrderedList | Mochott_Content_ListItem
  | Mochott_Content_TaskList | Mochott_Content_TaskItem
  | Mochott_Content_Blockquote | Mochott_Content_CodeBlock
  | Mochott_Content_MathBlock | Mochott_Content_MathInline
  | Mochott_Content_Details | Mochott_Content_Callout
  | Mochott_Content_LinkCard | Mochott_Content_Embed | Mochott_Content_Footnote
  | Mochott_Content_Table | Mochott_Content_Row | Mochott_Content_TableHeader | Mochott_Content_TableCell;
interface Mochott_Content_Doc {
  type: "doc";
  content: Mochott_Content_General_Union[];
}
interface Mochott_Content_General<T> {
  type: T;
  content?: Mochott_Content_General_Union[];
}
interface Mochott_Content_Paragraph extends Mochott_Content_General<"paragraph"> {
  attrs: {
    textAlign: Mochott_textAlign | null;
  };
}
interface Mochott_Content_Heading extends Mochott_Content_General<"heading"> {
  attrs: {
    level: number;
    textAlign: Mochott_textAlign | null;
  };
}
interface Mochott_Content_BulletList extends Mochott_Content_General<"bulletList"> {
  content: Mochott_Content_ListItem[];
}
interface Mochott_Content_OrderedList extends Mochott_Content_General<"orderedList"> {
  content: Mochott_Content_ListItem[];
}
interface Mochott_Content_ListItem extends Mochott_Content_General<"listItem"> {
  content: Mochott_Content_General_Union[];
}
interface Mochott_Content_TaskList extends Mochott_Content_General<"taskList"> {
  content: Mochott_Content_TaskItem[];
}
interface Mochott_Content_TaskItem extends Mochott_Content_General<"taskItem"> {
  attrs: {
    checked: boolean;
  };
  content: Mochott_Content_ListItem[];
}
interface Mochott_Content_Blockquote extends Mochott_Content_General<"blockquote"> {
  content: Mochott_Content_General_Union[];
}
type Mochott_Content_Callout_Type = "danger" | "info" | "warning" | "tip";
interface Mochott_Content_Callout extends Mochott_Content_General<"callout"> {
  attrs: {
    type: Mochott_Content_Callout_Type
  }
  content: Mochott_Content_General_Union[];
}
interface Mochott_Content_CodeBlock extends Mochott_Content_General<"codeBlock"> {
  attrs: {
    language: string;
  };
  content: Mochott_Content_General_Union[];
}
interface Mochott_Content_MathBlock {
  type: "mathBlock";
  attrs: {
    content: string;
  };
}
interface Mochott_Content_MathInline {
  type: "mathInline";
  attrs: {
    content: string;
  };
}
interface Mochott_Content_Details extends Mochott_Content_General<"details"> {
  attrs: {
    summary: string;
  }
}
interface Mochott_Content_LinkCard {
  type: "linkCard";
  attrs: {
    description: string;
    image: string;
    siteName: string;
    title: string;
    url: string;
  };
}
interface Mochott_Content_Embed {
  type: "embed";
  attrs: {
    embedUrl: string;
    service: string;
    src: string;
  };
}
interface Mochott_Content_Image {
  type: "image";
  attrs: {
    alt: string;
    "data-uploading": string | null;
    height: number | null;
    src: string;
    title: string;
    width: number | null;
  };
}
interface Mochott_Content_Table extends Mochott_Content_General<"table"> {
  content: Mochott_Content_Row[];
}
interface Mochott_Content_Row extends Mochott_Content_General<"tableRow"> {
  content: (Mochott_Content_TableHeader | Mochott_Content_TableCell)[];
}
interface Mochott_Content_TableCell_Attrs {
  colspan: number;
  colwidth: null | number;
  rowspan: number;
}
interface Mochott_Content_TableHeader extends Mochott_Content_General<"tableHeader"> {
  attrs: Mochott_Content_TableCell_Attrs;
}
interface Mochott_Content_TableCell extends Mochott_Content_General<"tableCell"> {
  attrs: Mochott_Content_TableCell_Attrs;
}
interface Mochott_Content_Footnote {
  type: "footnote";
  attrs: {
    content: string;
  };
}
type Mochott_Content_Marks_Union = Mochott_Content_Link | Mochott_Content_Bold | Mochott_Content_Itaric
  | Mochott_Content_Underline | Mochott_Content_Strike | Mochott_Content_Code | Mochott_Content_MathInline;
interface Mochott_Content_Text {
  type: "text";
  text: string;
  marks?: Mochott_Content_Marks_Union[]
}
interface Mochott_Content_Link {
  type: "link";
  attrs?: {
    class: string | null;
    href: string;
    rel: string;
    target: string;
    title: string | null;
  }
}
interface Mochott_Content_Bold {
  type: "bold";
}
interface Mochott_Content_Itaric {
  type: "italic";
}
interface Mochott_Content_Underline {
  type: "underline";
}
interface Mochott_Content_Strike {
  type: "strike";
}
interface Mochott_Content_Code {
  type: "code";
}
interface Mochott_Content_HardBreak {
  type: "hardBreak";
}
interface Mochott_Content_HorizontalRule {
  type: "horizontalRule";
}

interface Mochott_Raw_Article extends ATBaseType<"site.mochott.article"> {
  blobs: {
    blobref: ATBlob;
    name: string;
  }[];
  category: string;
  content: Mochott_Content_Doc;
  coverImage: ATBlob;
  createdAt: string;
  description: string;
  path: string;
  profile: string;
  slug: string;
  tags?: string[];
  textContent: string;
  title: string;
  updatedAt: string;
}

interface Mochott_Article extends Mochott_Raw_Article {
  url?: URL;
  host?: string;
  minisite?: Mochott_Minisite;
}