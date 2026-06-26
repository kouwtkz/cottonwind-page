
interface mochott_profile extends ATBaseType<"site.mochott.profile"> {
  url: string;
  name: string;
  articles: string[];
  createdAt: string;
  description: string;
}

interface mochott_raw_minisite extends ATBaseType<"site.mochott.minisite"> {
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
interface mochott_minisite extends mochott_raw_minisite {
  domain?: string;
}

type mochott_textAlign = "left" | "center" | "right";
type mochott_content_general_union = mochott_content_text | mochott_content_paragraph
  | mochott_content_heading | mochott_content_image
  | mochott_content_hardBreak | mochott_content_horizontalRule
  | mochott_content_bulletList | mochott_content_orderedList | mochott_content_listItem
  | mochott_content_taskList | mochott_content_taskItem
  | mochott_content_blockquote | mochott_content_codeBlock
  | mochott_content_mathBlock | mochott_content_mathInline
  | mochott_content_details | mochott_content_callout
  | mochott_content_linkCard | mochott_content_embed | mochott_content_footnote
  | mochott_content_table | mochott_content_row | mochott_content_tableHeader | mochott_content_tableCell;
interface mochott_content_doc {
  type: "doc";
  content: mochott_content_general_union[];
}
interface mochott_content_general<T> {
  type: T;
  content?: mochott_content_general_union[];
}
interface mochott_content_paragraph extends mochott_content_general<"paragraph"> {
  attrs: {
    textAlign: mochott_textAlign | null;
  };
}
interface mochott_content_heading extends mochott_content_general<"heading"> {
  attrs: {
    level: number;
    textAlign: mochott_textAlign | null;
  };
}
interface mochott_content_bulletList extends mochott_content_general<"bulletList"> {
  content: mochott_content_listItem[];
}
interface mochott_content_orderedList extends mochott_content_general<"orderedList"> {
  content: mochott_content_listItem[];
}
interface mochott_content_listItem extends mochott_content_general<"listItem"> {
  content: mochott_content_general_union[];
}
interface mochott_content_taskList extends mochott_content_general<"taskList"> {
  content: mochott_content_taskItem[];
}
interface mochott_content_taskItem extends mochott_content_general<"taskItem"> {
  attrs: {
    checked: boolean;
  };
  content: mochott_content_listItem[];
}
interface mochott_content_blockquote extends mochott_content_general<"blockquote"> {
  content: mochott_content_general_union[];
}
type mochott_content_callout_type = "danger" | "info" | "warning" | "tip";
interface mochott_content_callout extends mochott_content_general<"callout"> {
  attrs: {
    type: mochott_content_callout_type
  }
  content: mochott_content_general_union[];
}
interface mochott_content_codeBlock extends mochott_content_general<"codeBlock"> {
  attrs: {
    language: string;
  };
  content: mochott_content_general_union[];
}
interface mochott_content_mathBlock {
  type: "mathBlock";
  attrs: {
    content: string;
  };
}
interface mochott_content_mathInline {
  type: "mathInline";
  attrs: {
    content: string;
  };
}
interface mochott_content_details extends mochott_content_general<"details"> {
  attrs: {
    summary: string;
  }
}
interface mochott_content_linkCard {
  type: "linkCard";
  attrs: {
    description: string;
    image: string;
    siteName: string;
    title: string;
    url: string;
  };
}
interface mochott_content_embed {
  type: "embed";
  attrs: {
    embedUrl: string;
    service: string;
    src: string;
  };
}
interface mochott_content_image {
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
interface mochott_content_table extends mochott_content_general<"table"> {
  content: mochott_content_row[];
}
interface mochott_content_row extends mochott_content_general<"tableRow"> {
  content: (mochott_content_tableHeader | mochott_content_tableCell)[];
}
interface mochott_content_tableCell_attrs {
  colspan: number;
  colwidth: null | number;
  rowspan: number;
}
interface mochott_content_tableHeader extends mochott_content_general<"tableHeader"> {
  attrs: mochott_content_tableCell_attrs;
}
interface mochott_content_tableCell extends mochott_content_general<"tableCell"> {
  attrs: mochott_content_tableCell_attrs;
}
interface mochott_content_footnote {
  type: "footnote";
  attrs: {
    content: string;
  };
}
type mochott_content_marks_Union = mochott_content_link | mochott_content_bold | mochott_content_itaric
  | mochott_content_underline | mochott_content_strike | mochott_content_code | mochott_content_mathInline;
interface mochott_content_text {
  type: "text";
  text: string;
  marks?: mochott_content_marks_Union[]
}
interface mochott_content_link {
  type: "link";
  attrs?: {
    class: string | null;
    href: string;
    rel: string;
    target: string;
    title: string | null;
  }
}
interface mochott_content_bold {
  type: "bold";
}
interface mochott_content_itaric {
  type: "italic";
}
interface mochott_content_underline {
  type: "underline";
}
interface mochott_content_strike {
  type: "strike";
}
interface mochott_content_code {
  type: "code";
}
interface mochott_content_hardBreak {
  type: "hardBreak";
}
interface mochott_content_horizontalRule {
  type: "horizontalRule";
}

interface mochott_Raw_Article extends ATBaseType<"site.mochott.article"> {
  blobs: {
    blobref: ATBlob;
    name: string;
  }[];
  category: string;
  content: mochott_content_doc;
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

interface mochott_article extends mochott_Raw_Article {
  url?: URL;
  host?: string;
  minisite?: mochott_minisite;
}