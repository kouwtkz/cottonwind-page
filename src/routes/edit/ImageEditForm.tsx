import { HTMLAttributes, useEffect, useMemo, useRef, useState } from "react";
import { GalleryViewerPaging } from "@/state/ImageViewer";
import { toast } from "react-toastify";
import { useImageState } from "@/state/ImageState";
import {
  defaultGalleryTags,
  getTagsOptions,
  autoFixGalleryTagsOptions,
  ContentsTagsOption,
} from "@/components/dropdown/SortFilterTags";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FieldValues, useForm } from "react-hook-form";
import { AiFillEdit } from "react-icons/ai";
import {
  MdCleaningServices,
  MdDeleteForever,
  MdLibraryAddCheck,
  MdOutlineContentCopy,
} from "react-icons/md";
import { PostTextarea, usePreviewMode } from "@/components/parse/PostTextarea";
import { useCharacters, useCharactersMap } from "@/state/CharacterState";
import {
  AutoImageItemType,
  getCopyRightList,
} from "@/functions/media/imageFunction";
import { dateISOfromLocaltime, ToFormJST } from "@/functions/DateFunction";
import SetRegister from "@/components/hook/SetRegister";
import {
  PostEditSelectDecoration,
  PostEditSelectInsert,
  PostEditSelectMedia,
} from "@/components/dropdown/PostEditSelect";
import { useHotkeys } from "react-hotkeys-hook";
import { EditTagsReactSelect } from "@/components/dropdown/EditTagsReactSelect";
import { RbButtonArea } from "@/components/dropdown/RbButtonArea";
import { useApiOrigin } from "@/state/EnvState";
import { getExtension, getName } from "@/functions/doc/PathParse";
import { imageDataObject } from "@/state/DataState";
import {
  imageObject,
  imageOverSizeCheck,
  resizeImageCanvas,
  resizeImageCanvasProps,
} from "@/components/Canvas";
import { CharaImageSettingRbButtons } from "./CharacterEdit";
import { JoinUnique } from "@/functions/doc/StrFunctions";
import { charaTagsLabel } from "@/components/FormatOptionLabel";
import { corsFetchJSON, methodType } from "@/functions/fetch";
import { concatOriginUrl } from "@/functions/originUrl";
import { PromiseOrder, PromiseOrderStateType } from "@/functions/arrayFunction";
import { CreateState } from "@/state/CreateState";
import { useFiles } from "@/state/FileState";
import axios, { AxiosError } from "axios";
import {
  toastLoadingOptions,
  toastUpdateOptions,
} from "@/components/define/toastContainerDef";

interface Props extends HTMLAttributes<HTMLFormElement> {
  image: ImageType | null;
}
const defaultGalleryTypeOptions = (
  defaultGalleryTags.find(({ name }) => name === "type")?.options ?? []
).concat([{ value: "type:banner", label: "🖼バナー" }]);

export const useImageEditIsEdit = CreateState(false);
export const useImageEditIsEditHold = CreateState(false);
export const useImageEditIsDirty = CreateState(false);
export const useImageEditIsBusy = CreateState(false);

function FormToBoolean(v?: string) {
  switch (v) {
    case "true":
      return true;
    case "false":
      return false;
    case "null":
    case "undefined":
      return null;
    default:
      return;
  }
}

export default function ImageEditForm({ className, image, ...args }: Props) {
  const { images, imageAlbums: albums } = useImageState();
  const setImagesLoad = imageDataObject.useLoad()[1];
  const copyrightList = useMemo(() => getCopyRightList(images || []), [images]);
  const characters = useCharacters()[0] || [];
  const apiOrigin = useApiOrigin()[0];

  const [stateIsEdit, setIsEdit] = useImageEditIsEdit();
  const [stateIsEditHold] = useImageEditIsEditHold();
  const isEdit = useMemo(
    () => stateIsEdit || stateIsEditHold,
    [stateIsEdit, stateIsEditHold]
  );
  const [stateIsDirty, setIsDirty] = useImageEditIsDirty();
  const [isBusy, setIsBusy] = useImageEditIsBusy();

  const nav = useNavigate();
  const { state, search, pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const refForm = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const files = useFiles()[0];
  const embedList = useMemo(() => {
    const list = (files || []).concat();
    list.sort(
      (a, b) => (b.lastmod?.getTime() || 0) - (a.lastmod?.getTime() || 0)
    );
    return list;
  }, [files]);

  useHotkeys(
    "ctrl+enter",
    (e) => {
      if (isEdit && isDirty) SubmitImage();
    },
    { enableOnFormTags: true }
  );
  useHotkeys(
    "escape",
    (e) => {
      if (document.activeElement?.tagName !== "BODY") {
        (document.activeElement as HTMLElement).blur();
        e.preventDefault();
      }
    },
    { enableOnFormTags: true }
  );

  const charaLabelTags = useMemo(() => {
    return characters.map(({ name, key: id }) => ({
      label: name,
      value: id,
    }));
  }, [characters]);
  const simpleDefaultTags = useMemo(
    () => autoFixGalleryTagsOptions(getTagsOptions(defaultGalleryTags)),
    [defaultGalleryTags]
  );
  const unregisteredTags = useMemo(
    () =>
      (image?.tags ?? []).filter((tag) =>
        simpleDefaultTags.every(({ value }) => value !== tag)
      ),
    [image?.tags, defaultGalleryTags]
  );
  const defaultValues = useMemo(
    () => ({
      name: image?.name || "",
      description: image?.description || "",
      topImage: String(image?.topImage),
      pickup: String(image?.pickup),
      tags: image?.tags || [],
      characters: image?.characters || [],
      type: image?.type || "",
      time: ToFormJST(image?.time),
      copyright: image?.copyright || [],
      link: image?.link || "",
      draft: image?.draft,
      embed: image?.embed || "",
      album: image?.album || "",
      rename: image?.key || "",
    }),
    [image]
  );

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    control,
    formState: { isDirty, dirtyFields },
  } = useForm<FieldValues>({
    defaultValues,
  });

  useEffect(() => {
    if (stateIsDirty !== isDirty) {
      setIsDirty(isDirty);
    }
  }, [stateIsDirty, isDirty]);

  async function SubmitImage({
    deleteMode,
    turnOff = true,
  }: { deleteMode?: boolean; turnOff?: boolean } = {}) {
    setIsBusy(true);
    const fields = getValues();
    const data = {} as KeyValueAnyType;
    let method: methodType = "PATCH";
    data.id = image!.id;
    if (deleteMode) method = "DELETE";
    else {
      Object.entries(fields).forEach(([key, value]) => {
        if (dirtyFields[key as keyof typeof defaultValues]) {
          switch (key as keyof imageUpdateJsonDataType) {
            case "time":
              data[key] = value
                ? dateISOfromLocaltime(value)
                : new Date().toISOString();
              break;
            case "pickup":
            case "topImage":
              data[key] = FormToBoolean(value);
              break;
            default:
              value = Array.isArray(value) ? value.join(",") : value;
              if (typeof data[key] === "string") {
                if (value === "") data[key] = null;
                else if (isNaN(value)) data[key] = value;
                else data[key] = Number(value);
              } else data[key] = value;
              break;
          }
        }
      });
    }
    const res = await corsFetchJSON(
      concatOriginUrl(apiOrigin, "/image/send"),
      data,
      { method }
    ).finally(() => {
      setIsBusy(false);
      if (turnOff && isEdit) setIsEdit(false);
    });
    if (res.status === 200) {
      toast.success(deleteMode ? "削除しました" : "更新しました！", {
        autoClose: 2000,
      });
      if (dirtyFields.rename && fields.rename) {
        searchParams.set("image", getName(fields.rename));
        setSearchParams(searchParams, { replace: true });
      }
      setImagesLoad("no-cache");
      return true;
    } else {
      toast.error(res.statusText, {
        autoClose: 2000,
      });
      return false;
    }
  }

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues]);

  const { togglePreviewMode, previewMode } = usePreviewMode();
  const TypeTagsOption = useMemo(
    () =>
      defaultGalleryTypeOptions.map((o) => {
        const v = o.value ?? "";
        const value = v.slice(v.indexOf(":") + 1);
        return { ...o, value };
      }),
    [defaultGalleryTags]
  );
  const autoImageItemType = useMemo(
    () => AutoImageItemType(image?.embed, image?.albumObject?.type),
    [image?.embed, image?.albumObject?.type]
  );

  const [stateTags, setStateTags] = useState(
    autoFixGalleryTagsOptions(
      getTagsOptions(
        defaultGalleryTags.concat(
          unregisteredTags.map((value) => ({ label: value, value }))
        )
      )
    )
  );
  const [copyrightTags, setCopyrightTags] = useState(
    copyrightList.map(
      ({ value }) => ({ label: value, value } as ContentsTagsOption)
    )
  );
  const charactersMap = useCharactersMap()[0];
  const charaFormatOptionLabel = useMemo(() => {
    if (charactersMap) return charaTagsLabel(charactersMap);
  }, [charactersMap]);

  return (
    <>
      <RbButtonArea
        dropdown={
          <>
            <button
              title="マークダウン用のコピー"
              type="button"
              className="color round rb"
              onClick={() => {
                if (image) {
                  navigator.clipboard.writeText(`![](?image=${image.name})`);
                  toast.success("コピーしました", { autoClose: 1500 });
                }
              }}
            >
              <MdOutlineContentCopy />
            </button>
          </>
        }
      >
        {isEdit ? (
          <>
            <button
              title="リセット"
              type="reset"
              className="color round"
              onClick={() => {
                reset(defaultValues);
              }}
              disabled={isBusy}
            >
              <MdCleaningServices />
            </button>
            <button
              title="削除"
              type="button"
              className="warm round"
              onClick={async () => {
                if (confirm("本当に削除しますか？")) {
                  if (image && (await SubmitImage({ deleteMode: true }))) {
                    if (state) nav(-1);
                    else {
                      nav(pathname, {
                        preventScrollReset: true,
                      });
                    }
                  }
                }
              }}
              disabled={isBusy}
            >
              <MdDeleteForever />
            </button>
          </>
        ) : (
          <>
            <CharaImageSettingRbButtons image={image} />
          </>
        )}
        <button
          title={isEdit ? "保存" : "編集"}
          type="button"
          className="color round saveEdit"
          onClick={() => {
            if (isEdit && isDirty) SubmitImage();
            setIsEdit(!isEdit);
          }}
          disabled={isBusy}
        >
          {isEdit ? <MdLibraryAddCheck /> : <AiFillEdit />}
        </button>
      </RbButtonArea>
      {isEdit ? (
        <form
          {...args}
          ref={refForm}
          onSubmit={handleSubmit((e) => {
            setIsEdit(!isEdit);
            e.preventDefault();
          })}
          className={"edit window" + (className ? ` ${className}` : "")}
        >
          <label>
            <div className="label">タイトル</div>
            <div className="wide">
              <input
                className="title"
                title="タイトル"
                type="text"
                {...register("name")}
                disabled={isBusy}
              />
            </div>
          </label>
          <div>
            <div className="label">
              <span>説明文</span>
              <PostEditSelectMedia textarea={textareaRef.current} />
              <PostEditSelectDecoration textarea={textareaRef.current} />
              <PostEditSelectInsert textarea={textareaRef.current} />
              <button
                title="プレビューモードの切り替え"
                type="button"
                className="color"
                onClick={() => togglePreviewMode(getValues("description"))}
              >
                {previewMode ? "編集に戻る" : "プレビュー"}
              </button>
            </div>
            <div className="wide">
              <PostTextarea
                title="説明文"
                className="description"
                registed={SetRegister({
                  name: "description",
                  ref: textareaRef,
                  register,
                })}
                disabled={isBusy}
              />
            </div>
          </div>
          <div>
            <EditTagsReactSelect
              name="characters"
              labelVisible
              label="キャラクタータグ"
              tags={charaLabelTags}
              control={control}
              setValue={setValue}
              getValues={getValues}
              isBusy={isBusy}
              placeholder="キャラの選択"
              formatOptionLabel={charaFormatOptionLabel}
            />
          </div>
          <div>
            <EditTagsReactSelect
              name="tags"
              labelVisible
              label="その他のタグ"
              tags={stateTags}
              set={setStateTags}
              control={control}
              setValue={setValue}
              getValues={getValues}
              placeholder="その他のタグ選択"
              isBusy={isBusy}
              addButtonVisible
              enableEnterAdd
            />
          </div>
          <div>
            <EditTagsReactSelect
              name="copyright"
              labelVisible
              label="版権タグ（コピーライト）"
              tags={copyrightTags}
              set={setCopyrightTags}
              control={control}
              setValue={setValue}
              getValues={getValues}
              isBusy={isBusy}
              placeholder="版権タグ選択"
              addButtonVisible
              enableEnterAdd
            />
          </div>
          <div>
            <label className="ml">
              <span className="label-l">画像の種類</span>
              <select
                title="種類の選択"
                {...register("type")}
                disabled={isBusy}
              >
                <option value="">
                  自動(
                  {TypeTagsOption.find(
                    (item) => item.value === autoImageItemType
                  )?.label ?? autoImageItemType}
                  )
                </option>
                {TypeTagsOption.map((v, i) => (
                  <option value={v.value} key={i}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="ml">
              <input {...register("draft")} type="checkbox" />
              <span>下書き</span>
            </label>
          </div>
          <div>
            <div className="label">固定設定</div>
            <div className="flex wrap">
              <label className="ml">
                <span className="label-sl">トップ画像</span>
                <select
                  title="トップ画像"
                  {...register("topImage")}
                  disabled={isBusy}
                >
                  <option value="undefined">自動</option>
                  <option value="true">固定する</option>
                  <option value="false">固定しない</option>
                </select>
              </label>
              <label className="ml">
                <span className="label-sl">ピックアップ</span>
                <select
                  title="ピックアップ画像"
                  {...register("pickup")}
                  disabled={isBusy}
                >
                  <option value="undefined">自動</option>
                  <option value="true">固定する</option>
                  <option value="false">固定しない</option>
                </select>
              </label>
            </div>
          </div>
          <label>
            <div className="label">リンク</div>
            <div className="wide">
              <input
                title="リンク"
                type="text"
                {...register("link")}
                disabled={isBusy}
              />
            </div>
          </label>
          <label>
            <div className="label">埋め込み</div>
            <div className="wide">
              <input
                title="埋め込み"
                type="text"
                list="galleryEditEmbedList"
                {...register("embed")}
                disabled={isBusy}
              />
              <datalist id="galleryEditEmbedList">
                {embedList.map((file, i) => {
                  return (
                    <option key={i} value={file.key}>
                      {file.src || file.key}
                    </option>
                  );
                })}
              </datalist>
            </div>
          </label>
          <label>
            <div className="label-l">時間</div>
            <input
              title="時間"
              type="datetime-local"
              step={1}
              {...register("time")}
              disabled={isBusy}
            />
          </label>
          <label>
            <div className="label-l">アルバム移動</div>
            <input
              title="移動"
              {...register("album")}
              disabled={isBusy}
              list="album-list"
            />
            <datalist id="album-list">
              {albums
                ? Object.values(Object.fromEntries(albums))
                    .sort((a, b) => ((a.name || "") > (b.name || "") ? 1 : -1))
                    .map((album, i) => (
                      <option key={i} value={album.name}>
                        {album.name}
                      </option>
                    ))
                : null}
            </datalist>
          </label>
          <label className="around">
            <div className="label-l">ファイル名変更</div>
            <input
              title="ファイル名変更"
              className="flex-1"
              {...register("rename")}
              disabled={isBusy}
            />
          </label>
        </form>
      ) : null}
      <GalleryViewerPaging
        image={image}
        onClick={() => {
          if (isEdit && isDirty) SubmitImage();
        }}
      />
    </>
  );
}

export interface ImagesUploadOptions {
  album?: string;
  albumOverwrite?: boolean;
  tags?: string | string[];
  character?: string;
  webp?: boolean;
  thumbnail?: boolean | number;
  webpOptions?: resizeImageCanvasProps;
  direct?: boolean;
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
export async function MakeImagesUploadList({
  src,
  apiOrigin,
  tags,
  album,
  albumOverwrite,
  character,
  webp = true,
  thumbnail = true,
  webpOptions,
  direct,
}: MakeImagesUploadListProps) {
  const url = (apiOrigin || "") + "/image/send";
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
  const thumbnailSize = typeof thumbnail === "number" ? thumbnail : 340;
  const formDataList = await Promise.all(
    targetFiles.map(async (v) => {
      const object =
        typeof v === "string"
          ? { src: v, name: v }
          : typeof v === "object" && "src" in v
          ? { name: typeof v.src === "object" ? v.src.name : v.src, ...v }
          : { src: v, name: v.name };
      const basename = getName(object.name);
      const ext = getExtension(object.name);
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
          if (webp && ext !== "gif") {
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
            formData.append("file", object.src);
          }
          if (thumbnail) {
            const resizeProps: resizeImageCanvasProps = {
              image,
              size: thumbnailSize,
              type: "webp",
              expansion: false,
            };
            if (ext === "gif") {
              formData.append(
                "thumbnail",
                await resizeImageCanvas({
                  ...resizeProps,
                  imageSmoothingEnabled: false,
                }),
                webpName
              );
            } else if (imageOverSizeCheck(image, resizeProps.size!)) {
              formData.append(
                "thumbnail",
                await resizeImageCanvas({ ...resizeProps, quality: 0.8 }),
                webpName
              );
            } else {
              formData.append("thumbnail", "");
            }
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
      axios(url, {
        method: "POST",
        data,
        withCredentials: true,
        timeout: 2000,
      }).catch((e: AxiosError) => {
        if (e.response) return e.response;
        else throw e;
      })
  );
}

export interface ImagesUploadProps extends MakeImagesUploadListProps {
  interval?: number;
}
export async function ImagesUploadWithToast({
  interval = 10,
  ...args
}: ImagesUploadProps) {
  const state: PromiseOrderStateType = { abort: false };
  const id = toast.loading("アップロードの準備しています", {
    ...toastLoadingOptions,
    onClose() {
      state.abort = true;
      toast.info("アップロードが中断されました");
    },
  });
  const list = await MakeImagesUploadList(args);
  if (list.length > 0) {
    const render = "アップロード中…";
    return PromiseOrder(list, {
      interval,
      state,
      sync(i) {
        toast.update(id, {
          render,
          progress: i / list.length,
        });
      },
    })
      .then((results) => {
        const successCount = results.filter((r) => r.status === 200).length;
        if (results.length === successCount) {
          toast.update(id, {
            ...toastUpdateOptions,
            render: successCount + "件のアップロードに成功しました！",
            type: "success",
          });
        } else {
          console.error("以下のアップロードに失敗しました");
          const failedList = results
            .filter((r) => r.status !== 200)
            .map((r) => {
              const formData: FormData = r.data;
              const src = (formData.get("src") ||
                formData.get("icon")) as srcType;
              const name =
                src && typeof src === "object" && src.name ? src.name : src;
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
      .catch(() => {
        toast.update(id, {
          ...toastUpdateOptions,
          render: "失敗しました",
          type: "error",
        });
      });
  }
}

export async function ImagesUpload({
  interval = 10,
  ...args
}: ImagesUploadProps) {
  return MakeImagesUploadList(args).then((list) =>
    PromiseOrder(list, { interval })
  );
}

export const iconImagesUploadOptions: ImagesUploadOptions = {
  thumbnail: false,
  webpOptions: { expansion: false, size: 96 },
  direct: true,
};
