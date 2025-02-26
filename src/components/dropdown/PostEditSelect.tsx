import { HTMLAttributes, useEffect, useMemo, useRef } from "react";
import { DropdownObject, DropdownObjectBaseProps } from "./DropdownMenu";
import { useApiOrigin, useEnv } from "@/state/EnvState";
import { imageDataObject } from "@/state/DataState";
import { useLocation, useSearchParams } from "react-router-dom";
import { useSelectedImage } from "@/state/ImageState";
import { fileDialog } from "../FileTool";
import { ImagesUploadWithToast } from "@/layout/edit/ImageEditForm";
interface PostEditSelectBaseProps extends DropdownObjectBaseProps {
  textarea?: HTMLTextAreaElement | null;
  setValue?: (v: any) => void;
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
  setValue,
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
  if (setValue) setValue(textarea.value);
  textarea.focus();
}

interface replacePostTextareaFromImageProps extends PostEditSelectBaseProps {
  image: ImageType | ImageDataType;
}
export function replacePostTextareaFromImage({
  image,
  ...args
}: replacePostTextareaFromImageProps) {
  const searchParams = new URLSearchParams({ image: image.key });
  replacePostTextarea({
    ...args,
    before: `\n![${image.title}](?${searchParams})\n`,
    after: "",
  });
}

interface PostEditSelectProps extends PostEditSelectBaseProps {
  hidden?: boolean;
}

export interface MenuItemProps extends HTMLAttributes<HTMLDivElement> {
  value?: string;
}
export function MenuItem({ value, className, ...args }: MenuItemProps) {
  className = useMemo(() => {
    const list = ["item"];
    if (className) list.push(className);
    return list.join(" ");
  }, [className]);
  return (
    <div tabIndex={0} data-value={value} className={className} {...args} />
  );
}
export function PostEditSelectInsert({
  textarea,
  setValue,
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
          setValue,
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
  setValue,
}: PostEditSelectBaseProps & {
  value: string;
}) {
  if (!value || !textarea) return;
  switch (value) {
    case "br":
      replacePostTextarea({
        textarea,
        setValue,
        before: "\n<br/>\n\n",
        after: "",
      });
      break;
    case "more":
      replacePostTextarea({
        textarea,
        setValue,
        before: "\n<details>\n<summary>もっと読む</summary>\n\n",
        after: "\n</details>",
      });
      break;
    case "h2":
      replacePostTextarea({ textarea, setValue, before: "## ", after: "" });
      break;
    case "h3":
      replacePostTextarea({ textarea, setValue, before: "### ", after: "" });
      break;
    case "h4":
      replacePostTextarea({ textarea, setValue, before: "#### ", after: "" });
      break;
    case "li":
      replacePostTextarea({ textarea, setValue, before: "- ", after: "" });
      break;
    case "ol":
      replacePostTextarea({ textarea, setValue, before: "+ ", after: "" });
      break;
    case "code":
      replacePostTextarea({
        textarea,
        setValue,
        before: "```\n",
        after: "\n```",
      });
      break;
  }
}

export function PostEditSelectDecoration({
  textarea,
  setValue,
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
          setColorChange({
            textarea,
            setValue,
            colorChanger: colorChangerRef.current,
          });
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
            setValue,
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
  setValue,
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
      replacePostTextarea({ textarea, setValue, before: "*" });
      break;
    case "bold":
      replacePostTextarea({ textarea, setValue, before: "**" });
      break;
    case "strikethrough":
      replacePostTextarea({ textarea, setValue, before: "~~" });
      break;
  }
}

interface setColorChangeProps extends PostEditSelectBaseProps {
  colorChanger: HTMLInputElement | null;
}
export function setColorChange({
  textarea,
  setValue,
  colorChanger,
}: setColorChangeProps) {
  if (colorChanger && textarea)
    replacePostTextarea({
      textarea,
      setValue,
      before: `<span style="color:${colorChanger.value}">`,
      after: "</span>",
      replaceSelectionRegExp: /^<span style="color:[^>]+>(.*)<\/span>$/,
      insertWhenBlank: false,
    });
}

interface PostEditSelectMediaProps extends PostEditSelectProps {
  album?: string;
}

export function PostEditSelectMedia({
  textarea,
  setValue,
  className,
  MenuButton = "メディア",
  MenuButtonTitle = "メディア",
  MenuButtonClassName,
  album,
  autoClose,
}: PostEditSelectMediaProps) {
  const [env] = useEnv();
  const apiOrigin = useApiOrigin()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
  const [searchParams, setSearchParams] = useSearchParams();
  let { state } = useLocation();
  const selectedImage = useSelectedImage()[0];
  useEffect(() => {
    if (selectedImage)
      replacePostTextareaFromImage({
        image: selectedImage,
        textarea,
        setValue,
      });
  }, [selectedImage]);
  function setMedia(value: string) {
    if (!value || !textarea || !apiOrigin) return;
    switch (value) {
      case "upload":
        fileDialog("image/*", true)
          .then((files) => Array.from(files))
          .then((files) =>
            ImagesUploadWithToast({
              src: files,
              apiOrigin,
              album,
              notDraft: true,
            })
          )
          .then((list) => {
            setImagesLoad("no-cache");
            return list
              ?.map((r) => r.data as ImageDataType)
              .filter((data) => data);
          })
          .then((list) => {
            list?.forEach((data) => {
              replacePostTextareaFromImage({ image: data, textarea, setValue });
            });
          });
        break;
      case "external":
        if (env?.UPLOAD_BRACKET)
          replacePostTextarea({
            textarea,
            setValue,
            before: "![](",
            after: ")",
          });
        else textarea.focus();
        window.open(env?.UPLOAD_SERVICE, "uploadExternal");
        break;
      case "gallery":
        searchParams.set("modal", "gallery");
        if (!state) state = {};
        state.from = location.href;
        setSearchParams(searchParams, { state });
        break;
      case "link":
        replacePostTextarea({ textarea, setValue, before: "[](", after: ")" });
        break;
    }
  }
  return (
    <DropdownObject
      className={className}
      MenuButton={MenuButton}
      MenuButtonTitle={MenuButtonTitle}
      MenuButtonClassName={MenuButtonClassName}
      autoClose={autoClose}
      onClick={(e) => {
        setMedia(e.dataset.value || "");
      }}
    >
      <MenuItem value="link">リンク</MenuItem>
      <MenuItem value="gallery">ギャラリー</MenuItem>
      {album ? <MenuItem value="upload">アップロード</MenuItem> : null}
      {env?.UPLOAD_SERVICE ? (
        <MenuItem value="external">外部アップロード</MenuItem>
      ) : null}
    </DropdownObject>
  );
}
