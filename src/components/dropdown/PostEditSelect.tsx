import { HTMLAttributes, useRef } from "react";
import { DropdownObject, DropdownObjectBaseProps } from "./DropdownMenu";

interface PostEditSelectBaseProps extends DropdownObjectBaseProps {
  textarea: HTMLTextAreaElement | null;
}

interface replacePostTextareaProps extends PostEditSelectBaseProps {
  before?: string;
  after?: string;
  replaceSelectionRegExp?: RegExp;
  replaceSelectionValue?: string;
  insertWhenBlank?: boolean;
}
export function replacePostTextarea({
  textarea,
  before = "",
  after,
  replaceSelectionRegExp: reg,
  replaceSelectionValue = "$1",
  insertWhenBlank = true,
}: replacePostTextareaProps) {
  if (!textarea) return;
  if (after === undefined) after = before;
  const { selectionStart, selectionEnd } = textarea;
  let selection = textarea.value.slice(selectionStart, selectionEnd);
  if (reg) selection = selection.replace(reg, replaceSelectionValue);
  textarea.setRangeText(
    `${before}${selection}${after}`,
    selectionStart,
    selectionEnd
  );
  if (selectionStart === selectionEnd) {
    if (insertWhenBlank) {
      const selectionStartReset = selectionStart + before.length;
      textarea.setSelectionRange(selectionStartReset, selectionStartReset);
    } else {
      textarea.setSelectionRange(
        selectionStart,
        selectionStart + before.length + after.length
      );
    }
  }
  textarea.focus();
}

interface PostEditSelectProps extends PostEditSelectBaseProps {
  hidden?: boolean;
}

export interface MenuItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}
export function MenuItem({ value, ...args }: MenuItemProps) {
  return <div tabIndex={0} data-value={value} {...args} />;
}
export function PostEditSelectInsert({
  textarea,
  className,
  MenuButton = "追加",
  MenuButtonTitle = "追加",
  MenuButtonClassName,
  autoClose,
}: PostEditSelectProps) {
  return (
    <DropdownObject
      className={className}
      MenuButton={MenuButton}
      MenuButtonTitle={MenuButtonTitle}
      MenuButtonClassName={MenuButtonClassName}
      autoClose={autoClose}
      onClick={(e) => {
        setPostInsert({
          value: e.dataset.value ?? "",
          textarea,
        });
      }}
    >
      <MenuItem value="br">改行</MenuItem>
      <MenuItem value="more">もっと読む</MenuItem>
      <MenuItem value="h2">見出し2</MenuItem>
      <MenuItem value="h3">見出し3</MenuItem>
      <MenuItem value="h4">見出し4</MenuItem>
      <MenuItem value="li">リスト</MenuItem>
      <MenuItem value="ol">数字リスト</MenuItem>
      <MenuItem value="code">コード</MenuItem>
    </DropdownObject>
  );
}

export function setPostInsert({
  value,
  textarea,
}: PostEditSelectBaseProps & {
  value: string;
}) {
  if (!value || !textarea) return;
  switch (value) {
    case "br":
      replacePostTextarea({ textarea, before: "\n<br/>\n\n", after: "" });
      break;
    case "more":
      replacePostTextarea({
        textarea,
        before: "\n<details>\n<summary>もっと読む</summary>\n\n",
        after: "\n</details>",
      });
      break;
    case "h2":
      replacePostTextarea({ textarea, before: "## ", after: "" });
      break;
    case "h3":
      replacePostTextarea({ textarea, before: "### ", after: "" });
      break;
    case "h4":
      replacePostTextarea({ textarea, before: "#### ", after: "" });
      break;
    case "li":
      replacePostTextarea({ textarea, before: "- ", after: "" });
      break;
    case "ol":
      replacePostTextarea({ textarea, before: "+ ", after: "" });
      break;
    case "code":
      replacePostTextarea({ textarea, before: "```\n", after: "\n```" });
      break;
  }
}

export function PostEditSelectDecoration({
  textarea,
  className,
  MenuButton = "装飾",
  MenuButtonTitle = "装飾",
  MenuButtonClassName,
  autoClose,
}: PostEditSelectProps) {
  const colorChangerRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        type="color"
        placeholder="色"
        title="色"
        className="colorChanger withDropdown"
        tabIndex={-1}
        ref={colorChangerRef}
        onChange={() => {
          setColorChange({ textarea, colorChanger: colorChangerRef.current });
        }}
      />
      <DropdownObject
        className={className}
        MenuButton={MenuButton}
        MenuButtonTitle={MenuButtonTitle}
        MenuButtonClassName={MenuButtonClassName}
        autoClose={autoClose}
        onClick={(e) => {
          setDecoration({
            value: e.dataset.value ?? "",
            textarea,
            colorChanger: colorChangerRef.current,
          });
        }}
      >
        <MenuItem value="color">色変え</MenuItem>
        <MenuItem value="bold">強調</MenuItem>
        <MenuItem value="strikethrough">打消し線</MenuItem>
        <MenuItem value="italic">イタリック体</MenuItem>
      </DropdownObject>
    </>
  );
}

export function setDecoration({
  value,
  textarea,
  colorChanger,
}: PostEditSelectBaseProps & {
  value: string;
  colorChanger: HTMLInputElement | null;
}) {
  if (!value || !textarea) return;
  switch (value) {
    case "color":
      if (colorChanger) {
        colorChanger.focus();
        colorChanger.click();
      }
      break;
    case "italic":
      replacePostTextarea({ textarea, before: "*" });
      break;
    case "bold":
      replacePostTextarea({ textarea, before: "**" });
      break;
    case "strikethrough":
      replacePostTextarea({ textarea, before: "~~" });
      break;
  }
}

interface setColorChangeProps extends PostEditSelectBaseProps {
  colorChanger: HTMLInputElement | null;
}
export function setColorChange({
  textarea,
  colorChanger,
}: setColorChangeProps) {
  if (colorChanger && textarea)
    replacePostTextarea({
      textarea,
      before: `<span style="color:${colorChanger.value}">`,
      after: "</span>",
      replaceSelectionRegExp: /^<span style="color:[^>]+>(.*)<\/span>$/,
      insertWhenBlank: false,
    });
}

interface PostEditSelectMediaProps extends PostEditSelectProps {
  enableAttatch?: boolean;
  inputAttached?: HTMLInputElement | null;
}

export function PostEditSelectMedia({
  textarea,
  className,
  MenuButton = "メディア",
  MenuButtonTitle = "メディア",
  MenuButtonClassName,
  enableAttatch = false,
  inputAttached,
  autoClose,
}: PostEditSelectMediaProps) {
  return (
    <DropdownObject
      className={className}
      MenuButton={MenuButton}
      MenuButtonTitle={MenuButtonTitle}
      MenuButtonClassName={MenuButtonClassName}
      autoClose={autoClose}
      onClick={(e) => {
        setMedia({
          value: e.dataset.value ?? "",
          inputAttached,
          textarea,
        });
      }}
    >
      <MenuItem value="link">リンク</MenuItem>
      <MenuItem value="gallery">ギャラリー</MenuItem>
      {enableAttatch ? <MenuItem value="attached">添付</MenuItem> : null}
      <MenuItem value="upload">アップロード</MenuItem>
    </DropdownObject>
  );
}

interface setMediaProps extends PostEditSelectBaseProps {
  value: string;
  inputAttached?: HTMLInputElement | null;
}
export function setMedia({ value, inputAttached, textarea }: setMediaProps) {
  if (!value || !textarea) return;
  switch (value) {
    case "attached":
      if (inputAttached) {
        if (inputAttached.style.display === "none") inputAttached.value = "";
        inputAttached.click();
      }
      break;
    case "upload":
      if (import.meta.env.VITE_UPLOAD_BRACKET === "true")
        replacePostTextarea({ textarea, before: "![](", after: ")" });
      else textarea.focus();
      window.open(import.meta.env.VITE_UPLOAD_SERVICE, "upload");
      break;
    case "gallery":
      window.open("/gallery/", "gallery", "width=620px,height=720px");
      break;
    case "link":
      replacePostTextarea({ textarea, before: "[", after: "]()" });
      break;
  }
}
