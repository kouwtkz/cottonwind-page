import { useEffect, useState, type HTMLAttributes } from "react";
import { toast } from "react-toastify";
import { getExtension, getName } from "~/components/functions/doc/PathParse";
import {
  imageObject,
  imageOverSizeCheck,
  resizeImageCanvas,
  type resizeImageCanvasProps,
} from "~/components/Canvas";
import { JoinUnique } from "~/components/functions/doc/StrFunctions";
import { corsFetch } from "~/components/functions/fetch";
import { concatOriginUrl } from "~/components/functions/originUrl";
import {
  PromiseOrder,
  type PromiseOrderStateType,
} from "~/components/functions/arrayFunction";
import { CreateObjectState, CreateState } from "~/components/state/CreateState";
import {
  toastLoadingOptions,
  toastUpdateOptions,
} from "~/components/define/toastContainerDef";
import { RenameFile } from "~/components/utils/FileTool";
import { ModeSwitch } from "~/components/layout/edit/CommonSwitch";
import {
  RiArtboard2Fill,
  RiFileUploadLine,
  RiFileWordLine,
} from "react-icons/ri";
import ImageEditFormClient from "./ImageEditForm.client";

export interface ImageEditFormProps extends HTMLAttributes<HTMLFormElement> {
  image: ImageType | null;
}

interface ImageEditProps {
  isEdit: boolean;
  isDirty: boolean;
  isBusy: boolean;
}
export const useImageEditState = CreateObjectState<ImageEditProps>((s) => ({
  isEdit: false,
  isDirty: false,
  isBusy: false,
}));
export const useImageEditSwitchHold = CreateState(false);

const IMAGE_SEND = "/image/send";

export default function ImageEditForm(props: ImageEditFormProps) {
  const [enable, setEnable] = useState(false);
  useEffect(() => {
    if (Boolean(ImageEditFormClient)) setEnable(true);
    else setEnable(false);
  }, [ImageEditFormClient]);
  return <>{enable ? <ImageEditFormClient {...props} /> : null}</>;
}

export interface ImagesUploadOptions {
  album?: string;
  albumOverwrite?: boolean;
  tags?: string | string[];
  character?: string;
  original?: boolean;
  webp?: boolean;
  thumbnail?: boolean | number;
  webpOptions?: resizeImageCanvasProps;
  notDraft?: boolean;
}
type srcType = string | File;
export type srcObjectType = {
  name?: string;
  tags?: string;
  character?: string;
  src: srcType;
};
type srcWithObjectType = srcType | srcObjectType;
export interface MakeImagesUploadListProps extends ImagesUploadOptions {
  src: srcWithObjectType | srcWithObjectType[];
  apiOrigin?: string;
}
export interface MakeImagesUploadListResponse<T> extends Response {
  data?: T;
}
export async function MakeImagesUploadList({
  src,
  apiOrigin,
  tags,
  album,
  albumOverwrite,
  character,
  original = true,
  webp,
  thumbnail = true,
  webpOptions,
  notDraft: direct,
}: MakeImagesUploadListProps) {
  const url = concatOriginUrl(apiOrigin, IMAGE_SEND);
  const checkTime = new Date().getTime();
  const files = Array.isArray(src) ? src : [src];
  const targetFiles = files.filter((v) => {
    const file = typeof v === "object" && "src" in v ? v.src : v;
    if (typeof file === "object") {
      const lastModified =
        "lastModified" in file ? file.lastModified : undefined;
      if (lastModified) {
        const fromBrowser = Math.abs(checkTime - lastModified) < 200;
        if (fromBrowser) return false;
      }
    }
    return true;
  });
  if (targetFiles.length === 0) return [];
  const formDataList = await Promise.all(
    targetFiles.map(async (v) => {
      const object =
        typeof v === "string"
          ? { src: v, name: v }
          : typeof v === "object" && "src" in v
          ? { name: typeof v.src === "object" ? v.src.name : v.src, ...v }
          : { src: v, name: v.name };
      const filename =
        typeof object.src === "object" ? object.src.name : object.src;
      const ext = getExtension(filename);
      const basename = getName(object.name);
      const webpName = basename + ".webp";
      const formData = new FormData();
      if (album) formData.append("album", album);
      if (typeof albumOverwrite === "boolean")
        formData.append("albumOverwrite", String(albumOverwrite));
      const joinedTags = JoinUnique(tags, object.tags);
      if (joinedTags) formData.append("tags", joinedTags);
      const joinedCharacters = JoinUnique(character, object.character);
      if (joinedCharacters) formData.append("characters", joinedCharacters);
      switch (ext) {
        case "svg":
          break;
        default:
          const image = await imageObject(object.src);
          if (original) {
            if ((webpOptions || webp) && ext !== "gif") {
              formData.append(
                "file",
                await resizeImageCanvas({
                  image,
                  type: "webp",
                  ...webpOptions,
                }),
                webpName
              );
            } else {
              if (typeof object.src !== "string") {
                const uploadFile =
                  object.src.name === object.name
                    ? object.src
                    : RenameFile(object.src, object.name);
                formData.append("file", uploadFile);
              }
            }
          }
          if (thumbnail) {
            await resizeThumbnail({
              size: thumbnail,
              src: image,
              resizeGif: !original,
            }).then((resized) => {
              if (resized) {
                formData.append("thumbnail", resized, webpName);
              }
            });
          }
          break;
      }
      if (direct) formData.append("direct", "");
      if (typeof object.src === "object")
        formData.append("mtime", String(object.src.lastModified));
      return formData;
    })
  );
  return formDataList.map(
    (data) => () =>
      corsFetch(concatOriginUrl(apiOrigin, "image/send"), {
        method: "POST",
        body: data,
        timeout: 10000,
      })
        .then(async (v) => {
          const r = v as MakeImagesUploadListResponse<ImageDataType>;
          r.data = await v.json();
          return r;
        })
        .catch((e: Response) => {
          const r = e as MakeImagesUploadListResponse<Partial<ImageDataType>>;
          const stock: unknown[] = [];
          const file = data.get("file") as File | null;
          if (file?.name) stock.push(file.name);
          stock.push(data);
          stock.push(e);
          console.error(...stock);
          r.data = {
            src: data.get("src") as string,
          };
          return r;
        })
  );
}

interface resizeThumbnailProps {
  size?: number | boolean;
  src: string | HTMLImageElement;
  resizeGif?: boolean;
}
async function resizeThumbnail({ size, src, resizeGif }: resizeThumbnailProps) {
  const img = typeof src === "string" ? await imageObject(src) : src;
  const ext = getExtension(img.src);
  const thumbnailSize = typeof size === "number" ? size : 340;
  const resizeProps: resizeImageCanvasProps = {
    image: img,
    size: thumbnailSize,
    type: "webp",
    expansion: false,
  };
  if (imageOverSizeCheck(img, resizeProps.size!)) {
    return resizeImageCanvas({ ...resizeProps, quality: 0.8 });
  } else if (ext === "gif" || resizeGif) {
    return resizeImageCanvas({
      ...resizeProps,
      imageSmoothingEnabled: false,
    });
  }
}

export interface ImagesUploadProps extends MakeImagesUploadListProps {
  sleepTime?: number;
}
export async function ImagesUploadWithToast({
  sleepTime = 10,
  ...args
}: ImagesUploadProps) {
  if (Array.isArray(args.src) && args.src.length === 0) return;
  const state: PromiseOrderStateType = { abort: false };
  const id = toast.loading("アップロードの準備しています", {
    ...toastLoadingOptions,
    onClose() {
      state.abort = true;
      if (list.length > 0) {
        toast.info("アップロードが中断されました");
      } else {
        toast.info("アップロード可能なファイルがありませんでした");
      }
    },
  });
  const list = await MakeImagesUploadList(args);
  if (list.length > 0) {
    const render = "アップロード中…";
    return PromiseOrder(list, {
      sleepTime,
      state,
      sync(i) {
        toast.update(id, {
          render,
          progress: i / list.length,
        });
      },
    })
      .then((results) => {
        console.log(results);
        const successCount = results.filter((r) => r.status === 200).length;
        if (results.length === successCount) {
          toast.update(id, {
            ...toastUpdateOptions,
            render: successCount + "件のアップロードに成功しました！",
            type: "success",
          });
        } else {
          const failedList = results
            .filter((r) => r.status !== 200)
            .map((_) => {
              const r = _ as Response & { data: ImageDataType };
              const image = r.data;
              const src = image.src;
              const name = src;
              return name;
            });
          toast.update(id, {
            ...toastUpdateOptions,
            render:
              (successCount
                ? successCount + "件のアップロードに成功しましたが、"
                : "") +
              failedList.length +
              "件のアップロードに失敗しました\n" +
              failedList.join("\n"),
            type: "error",
          });
        }
        return results;
      })
      .catch((e) => {
        console.log({ e });
        toast.update(id, {
          ...toastUpdateOptions,
          render: "アップロードに失敗したファイルが含まれています",
          type: "error",
        });
      });
  } else {
    toast.dismiss(id);
  }
}

export async function ImagesUpload({
  sleepTime = 10,
  ...args
}: ImagesUploadProps) {
  return MakeImagesUploadList(args).then((list) =>
    PromiseOrder(list, { sleepTime })
  );
}

export const iconImagesUploadOptions: ImagesUploadOptions = {
  thumbnail: false,
  webpOptions: { expansion: false, size: 96 },
  notDraft: true,
};

export const useUploadWebp = CreateState(false);
export function SwitchUploadWebp() {
  return (
    <ModeSwitch
      toEnableTitle="画像をWebPファイルでアップロードする"
      toDisableTitle="画像を元のファイルのままアップロードに戻す"
      useSwitch={useUploadWebp}
    >
      <RiFileWordLine />
    </ModeSwitch>
  );
}

export const useNoUploadThumbnail = CreateState(false);
export function SwitchNoUploadThumbnail() {
  return (
    <ModeSwitch
      toEnableTitle="サムネイルのアップロードをしないに切り替える"
      toDisableTitle="サムネイルをアップロードする状態に戻す"
      useSwitch={useNoUploadThumbnail}
    >
      <RiArtboard2Fill />
    </ModeSwitch>
  );
}

export const useImageNotDraftUpload = CreateState(false);
export function SwitchNotDraftUpload() {
  return (
    <ModeSwitch
      toEnableTitle="下書きなしでアップロードする"
      useSwitch={useImageNotDraftUpload}
    >
      <RiFileUploadLine />
    </ModeSwitch>
  );
}
