import {
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GalleryViewerPaging } from "@/state/ImageViewer";
import { ImageMee } from "@/layout/ImageMee";
import toast from "react-hot-toast";
import { imageAlbumsAtom, imagesAtom } from "@/state/ImageState";
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
import { charactersAtom } from "@/state/CharacterState";
import {
  AutoImageItemType,
  getCopyRightList,
} from "@/functions/imageFunctions";
import { ToFormJST } from "@/functions/DateFormat";
import { atom, useAtom } from "jotai";
import SetRegister from "@/components/hook/SetRegister";
import {
  PostEditSelectDecoration,
  PostEditSelectInsert,
  PostEditSelectMedia,
} from "@/components/dropdown/PostEditSelect";
import { useHotkeys } from "react-hotkeys-hook";
import { EditTagsReactSelect } from "@/components/dropdown/EditTagsReactSelect";
import { RbButtonArea } from "@/components/dropdown/RbButtonArea";
import { ApiOriginAtom } from "@/state/EnvState";
import { getExtension, getName } from "@/functions/doc/PathParse";
import { FormTags } from "react-hotkeys-hook/dist/types";
import { imagesLoadAtom, UploadToast } from "@/state/DataState";
import { sleep } from "@/functions/Time";
import {
  imageObject,
  imageOverSizeCheck,
  resizeImageCanvas,
  resizeImageCanvasProps,
} from "@/components/Canvas";
import { CharaImageSettingRbButtons } from "./CharacterEdit";
import { JoinUnique } from "@/functions/doc/StrFunctions";
type labelValue = { label: string; value: string };

interface Props extends HTMLAttributes<HTMLFormElement> {
  image: ImageType | null;
}

export const imageEditIsEdit = atom(false);
export const imageEditIsEditHold = atom(false);
export const imageEditIsDirty = atom(false);
export const imageEditIsBusy = atom(false);

export default function ImageEditForm({ className, image, ...args }: Props) {
  const images = useAtom(imagesAtom)[0];
  const albums = useAtom(imageAlbumsAtom)[0];
  const setImagesLoad = useAtom(imagesLoadAtom)[1];
  const copyrightList = useMemo(() => getCopyRightList(images || []), [images]);
  const characters = useAtom(charactersAtom)[0] || [];
  const apiOrigin = useAtom(ApiOriginAtom)[0];

  const [stateIsEdit, setIsEdit] = useAtom(imageEditIsEdit);
  const [stateIsEditHold] = useAtom(imageEditIsEditHold);
  const isEdit = useMemo(
    () => stateIsEdit || stateIsEditHold,
    [stateIsEdit, stateIsEditHold]
  );
  const [stateIsDirty, setIsDirty] = useAtom(imageEditIsDirty);
  const [isBusy, setIsBusy] = useAtom(imageEditIsBusy);

  const nav = useNavigate();
  const { state, search, pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const refForm = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const enableOnFormTags: FormTags[] = ["INPUT", "TEXTAREA", "SELECT"];

  useHotkeys(
    "ctrl+enter",
    (e) => {
      if (isEdit && isDirty) SubmitImage();
    },
    { enableOnFormTags }
  );
  useHotkeys(
    "escape",
    (e) => {
      if (document.activeElement?.tagName !== "BODY") {
        (document.activeElement as HTMLElement).blur();
        e.preventDefault();
      }
    },
    { enableOnFormTags }
  );

  const charaLabelTags = useMemo(() => {
    return characters.map(({ name, id }) => ({
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
    const formdata = new FormData();
    let method = "PATCH";
    formdata.append("id", String(image!.id));
    formdata.append("src", String(image!.src));
    if (deleteMode) method = "DELETE";
    else {
      Object.entries(fields).forEach(([key, value]) => {
        if (dirtyFields[key as keyof typeof defaultValues])
          formdata.append(key, Array.isArray(value) ? value.join(",") : value);
      });
    }
    const res = await fetch(apiOrigin + "/image/send", {
      method,
      body: formdata,
    }).finally(() => {
      setIsBusy(false);
      if (turnOff && isEdit) setIsEdit(false);
    });
    if (res.status === 200) {
      toast(deleteMode ? "削除しました" : "更新しました！", {
        duration: 2000,
      });
      if (dirtyFields.rename && fields.rename) {
        searchParams.set("image", getName(fields.rename));
        setSearchParams(searchParams, { replace: true });
      }
      setImagesLoad("no-cache");
      return true;
    } else {
      toast.error(res.statusText, {
        duration: 2000,
      });
      return false;
    }
  }

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues]);

  const CharaTagsLabel = useCallback(
    ({ option }: { option?: labelValue }) => {
      const chara = characters.find((chara) => chara.id === option?.value);
      return (
        <div className="flex center">
          <span className="label-sl">
            {chara?.media?.icon ? (
              <ImageMee
                imageItem={chara.media.icon}
                mode="icon"
                width={24}
                height={24}
                className="charaIcon"
              />
            ) : (
              <>{chara?.defEmoji}</>
            )}
          </span>
          <span>{chara?.name}</span>
        </div>
      );
    },
    [characters]
  );

  const { togglePreviewMode, previewMode } = usePreviewMode();
  const TypeTagsOption = useMemo(
    () =>
      (
        defaultGalleryTags.find(({ name }) => name === "type")?.options ?? []
      ).map((o) => {
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

  return (
    <>
      <RbButtonArea
        dropdown={
          <>
            <button
              title="マークダウン用のコピー"
              type="button"
              className="round rb"
              onClick={() => {
                if (image) {
                  navigator.clipboard.writeText(`![](?image=${image.name})`);
                  toast("コピーしました", { duration: 1500 });
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
              className="round"
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
              className="round red"
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
          className="round saveEdit"
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
          <label>
            <span className="label-l">画像の種類</span>
            <select title="種類の選択" {...register("type")} disabled={isBusy}>
              <option value="">
                自動(
                {TypeTagsOption.find((item) => item.value === autoImageItemType)
                  ?.label ?? autoImageItemType}
                )
              </option>
              {TypeTagsOption.map((v, i) => (
                <option value={v.value} key={i}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <div>
            <div className="label">固定設定</div>
            <div className="wide flex around">
              <label>
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
              <label>
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
                {...register("embed")}
                disabled={isBusy}
              />
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
            <select title="移動" {...register("album")} disabled={isBusy}>
              {albums
                ? Object.values(Object.fromEntries(albums))
                    .sort((a, b) => ((a.name || "") > (b.name || "") ? 1 : -1))
                    .map((album, i) => (
                      <option key={i} value={album.name}>
                        {album.name}
                      </option>
                    ))
                : null}
            </select>
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

interface ImagesUploadOptions {
  album?: string;
  albumOverwrite?: boolean;
  tags?: string | string[];
  character?: string;
  original?: boolean;
  webp?: boolean;
  thumbnail?: boolean | number;
  icon?: boolean | number;
  iconOnly?: boolean | number;
}
export type srcObjectType = {
  name?: string;
  tags?: string;
  character?: string;
  src: string | File;
};
type srcType = string | File | srcObjectType;
interface ImagesUploadProps extends ImagesUploadOptions {
  src: srcType | srcType[];
  apiOrigin?: string;
}
export async function ImagesUploadProcess({
  src,
  apiOrigin,
  tags,
  album,
  albumOverwrite,
  character,
  original = true,
  webp = true,
  thumbnail = true,
  icon = false,
  iconOnly = false,
}: ImagesUploadProps) {
  if (iconOnly) {
    original = false;
    webp = false;
    thumbnail = false;
    icon = iconOnly;
  }
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
  if (targetFiles.length === 0) return false;
  const thumbnailSize = typeof thumbnail === "number" ? thumbnail : 340;
  const iconSize = typeof icon === "number" ? icon : 96;
  const fetchList = await Promise.all(
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
      if (original) formData.append("attached", object.src);
      switch (ext) {
        case "svg":
          break;
        default:
          const image = await imageObject(object.src);
          if (webp) {
            if (ext !== "gif") {
              formData.append(
                "webp",
                await resizeImageCanvas({
                  image,
                  type: "webp",
                }),
                webpName
              );
            } else formData.append("webp", "");
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
          if (icon) {
            const resizeProps: resizeImageCanvasProps = {
              image,
              size: iconSize,
              type: "webp",
              expansion: false,
            };
            formData.append(
              "icon",
              await resizeImageCanvas(resizeProps),
              webpName
            );
          }
          break;
      }
      if (typeof object.src === "object")
        formData.append("mtime", String(object.src.lastModified));
      if (iconOnly) {
        formData.append("width", String(iconSize));
        formData.append("height", String(iconSize));
      }
      return () =>
        fetch(url, {
          method: "POST",
          body: formData,
        });
    })
  );
  const results: Response[] = [];
  for (let i = 0; i < fetchList.length; i++) {
    results.push(await fetchList[i]());
    await sleep(10);
  }
  const successCount = results.filter((r) => r.status === 200).length;
  if (results.length === successCount) {
    return {
      message: successCount + "件のアップロードに成功しました！",
      results,
    };
  } else {
    throw {
      message:
        (successCount
          ? successCount + "件のアップロードに成功しましたが、"
          : "") +
        (results.length - successCount) +
        "件のアップロードに失敗しました",
      results,
    };
  }
}

export async function ImagesUpload(args: ImagesUploadProps) {
  return UploadToast(ImagesUploadProcess(args));
}

export function ImageGlobalEditModeSwitch() {
  const [isEditHold, setIsEditHold] = useAtom(imageEditIsEditHold);
  return (
    <button
      title={isEditHold ? "元に戻す" : "常に編集モードにする"}
      type="button"
      onClick={() => {
        setIsEditHold(!isEditHold);
      }}
      style={{ opacity: isEditHold ? 1 : 0.4 }}
    >
      <AiFillEdit />
    </button>
  );
}
