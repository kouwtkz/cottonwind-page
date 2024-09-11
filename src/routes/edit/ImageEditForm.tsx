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
import { AutoImageItemType, getCopyRightList } from "@/data/functions/images";
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
import { getBasename, getExtension, getName } from "@/functions/doc/PathParse";
import { FormTags } from "react-hotkeys-hook/dist/types";
import { imagesLoadAtom, UploadToast } from "@/state/DataState";
import { sleep } from "@/functions/Time";
import {
  imageObject,
  imageOverSizeCheck,
  resizeImageCanvas,
  resizeImageCanvasProps,
} from "@/components/Canvas";
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
  const copyrightList = useMemo(() => getCopyRightList(images), [images]);
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
      rename: image?.src ? getBasename(image.src) : "",
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
      <RbButtonArea>
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
  tags?: string | string[];
  character?: string;
}
interface ImagesUploadProps {
  files: File[];
  apiOrigin?: string;
  options?: ImagesUploadOptions;
}
export async function ImagesUploadProcess({
  files,
  apiOrigin,
  options = {},
}: ImagesUploadProps) {
  const url = (apiOrigin || "") + "/image/send";
  const checkTime = new Date().getTime();
  const targetFiles = files.filter((file) => {
    const fromBrowser = Math.abs(checkTime - file.lastModified) < 200;
    if (fromBrowser) {
      return false;
    } else {
      return true;
    }
  });
  if (targetFiles.length === 0) return false;
  const joinedTags = Array.isArray(options.tags)
    ? options.tags.join(",")
    : options.tags;
  const fetchList = await Promise.all(
    targetFiles.map(async (file) => {
      const name = getName(file.name);
      const ext = getExtension(file.name);
      const webpName = name + ".webp";
      const formData = new FormData();
      if (options.album) formData.append("album", options.album);
      if (joinedTags) formData.append("tags", joinedTags);
      if (options.character) formData.append("characters", options.character);
      formData.append("attached", file);
      switch (ext) {
        case "svg":
          break;
        default:
          const image = await imageObject(file);
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
          const thumbnailProps: resizeImageCanvasProps = {
            image,
            size: 340,
            type: "webp",
            expansion: false,
          };
          if (ext === "gif") {
            formData.append(
              "thumbnail",
              await resizeImageCanvas({
                ...thumbnailProps,
                imageSmoothingEnabled: false,
              }),
              webpName
            );
          } else if (imageOverSizeCheck(image, thumbnailProps.size!)) {
            formData.append(
              "thumbnail",
              await resizeImageCanvas({ ...thumbnailProps, quality: 0.8 }),
              webpName
            );
          } else {
            formData.append("thumbnail", "");
          }
          break;
      }
      if (file.lastModified)
        formData.append("mtime", String(file.lastModified));
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
    return successCount + "件のアップロードに成功しました！";
  } else {
    throw (
      (successCount
        ? successCount + "件のアップロードに成功しましたが、"
        : "") +
      (results.length - successCount) +
      "件のアップロードに失敗しました"
    );
  }
}

export async function ImagesUpload(args: ImagesUploadProps) {
  return UploadToast(ImagesUploadProcess(args));
}
