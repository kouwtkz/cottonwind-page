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
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useImageState } from "@/state/ImageState";
import {
  defaultGalleryTags,
  getTagsOptions,
  autoFixGalleryTagsOptions,
  ContentsTagsOption,
  ContentsTagsOptionDispatch,
} from "@/components/dropdown/SortFilterTags";
import { useLocation, useNavigate } from "react-router-dom";
import { useEmbedState } from "@/state/Embed";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { MakeRelativeURL } from "@/functions/doc/MakeURL";
import { AiFillEdit } from "react-icons/ai";
import {
  MdCleaningServices,
  MdDeleteForever,
  MdLibraryAddCheck,
  MdOutlineContentCopy,
} from "react-icons/md";
import ReactSelect from "react-select";
import { callReactSelectTheme } from "@/theme/main";
import {
  PostTextarea,
  usePreviewMode,
} from "@/components/parse/PostTextarea";
import { useCharaState } from "@/state/CharaState";
import { AutoImageItemType } from "@/data/functions/images";
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
type labelValue = { label: string; value: string };

interface Props extends HTMLAttributes<HTMLFormElement> {
  image: MediaImageItemType | null;
}

export const imageEditIsEdit = atom(false);
export const imageEditIsEditHold = atom(false);
export const imageEditIsDirty = atom(false);
export const imageEditIsBusy = atom(false);

export default function ImageEditForm({ className, image, ...args }: Props) {
  const { imageObject, setImageFromUrl } = useImageState();
  const { imageAlbumList, copyrightList } = imageObject;
  const { charaList } = useCharaState();
  const { list: embedList } = useEmbedState();

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
  const refForm = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useHotkeys(
    "escape",
    (e) => {
      if (document.activeElement?.tagName !== "BODY") {
        (document.activeElement as HTMLElement).blur();
        e.preventDefault();
      }
    },
    { enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"] }
  );

  const charaTags = useMemo(() => {
    return charaList.map(({ name, id }) => ({
      label: name,
      value: id,
    }));
  }, [charaList]);
  const imageTagsObject = useMemo(() => {
    const tags = image?.tags || [];
    const imageCharaTags = tags.filter((tag) =>
      charaTags.some((chara) => tag === chara.value)
    );
    const imageOtherTags = tags.filter((tag) =>
      imageCharaTags.every((_tag) => tag !== _tag)
    );
    return { charaTags: imageCharaTags, otherTags: imageOtherTags };
  }, [image, charaTags]);
  const simpleDefaultTags = useMemo(
    () => autoFixGalleryTagsOptions(getTagsOptions(defaultGalleryTags)),
    [defaultGalleryTags]
  );
  const unregisteredTags = useMemo(
    () =>
      imageTagsObject.otherTags.filter((tag) =>
        simpleDefaultTags.every(({ value }) => value !== tag)
      ),
    [imageTagsObject.otherTags, defaultGalleryTags]
  );
  const defaultValues = useMemo(
    () => ({
      name: image?.name || "",
      description: image?.description || "",
      topImage: String(image?.topImage),
      pickup: String(image?.pickup),
      ...imageTagsObject,
      type: image?.originType || "",
      time: ToFormJST(image?.time),
      copyright: image?.copyright || [],
      link: image?.link || "",
      embed: image?.embed || "",
      move: image?.album?.dir || "",
      rename: image?.originName || "",
    }),
    [image, imageTagsObject]
  );

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    control,
    formState: { isDirty },
  } = useForm<FieldValues>({
    defaultValues,
  });

  useEffect(() => {
    if (stateIsDirty !== isDirty) {
      setIsDirty(isDirty);
    }
  }, [stateIsDirty, isDirty]);

  async function sendUpdate({
    image,
    deleteMode = false,
    otherSubmit = false,
  }: {
    image: MediaImageItemType;
    deleteMode?: boolean;
    otherSubmit?: boolean;
  }) {
    setIsBusy(true);
    const {
      album,
      resized,
      resizeOption,
      URL,
      move,
      rename,
      size,
      type,
      originType,
      setType,
      ..._image
    } = image;
    const res = await axios
      .patch("/gallery/send", {
        ..._image,
        albumDir: album?.dir,
        type: setType,
        move,
        rename,
        deleteMode,
      })
      .catch((r) => (r as AxiosError<any>).response!)
      .finally(() => {
        setIsBusy(false);
      });
    if (res.status === 200) {
      toast(deleteMode ? "削除しました" : "更新しました！", {
        duration: 2000,
      });
      setImageFromUrl();
      if (!otherSubmit && (move || rename)) {
        const query = Object.fromEntries(new URLSearchParams(location.search));
        const movedAlbum = move
          ? imageAlbumList.find((a) => a.dir === move)
          : null;
        if (movedAlbum) query.album = movedAlbum.name;
        if (rename) query.image = rename;
        setTimeout(() => {
          if (location.search === search && location.pathname === pathname) {
            nav(MakeRelativeURL({ query }), {
              replace: true,
              preventScrollReset: false,
              state,
            });
          }
        }, 200);
      }
      return true;
    } else {
      toast.error(res.data, {
        duration: 2000,
      });
      return false;
    }
  }

  const getCompareValues = (values: FieldValues) => {
    const setValues: FieldValues = {};
    Object.entries(values).forEach(([k, v]) => {
      switch (k) {
        case "charaTags":
        case "otherTags":
          setValues.tags = (setValues.tags || []).concat(v || []);
          break;
        default:
          setValues[k] = v;
          break;
      }
    });
    return setValues;
  };
  async function SubmitImage(
    image?: MediaImageItemType | null,
    otherSubmit = false
  ) {
    if (!image || !isDirty || !defaultValues) return;
    const formValues = getValues();
    if (formValues.embed.includes(".")) {
      formValues.embed = formValues.embed
        .replaceAll("\\", "/")
        .replace(/^_data/i, "");
    }
    const formValuesList = getCompareValues(formValues);
    const formDefaultValues = getCompareValues(defaultValues);
    const updateEntries = Object.entries(formValuesList).filter(([k, v]) => {
      if (Array.isArray(v)) {
        return formDefaultValues[k].join(",") !== v.join(",");
      } else {
        switch (k) {
          case "move":
            return v !== image.album?.dir;
          case "rename":
            return v !== image.originName;
          default:
            return formDefaultValues[k] !== v;
        }
      }
    });
    if (updateEntries.length === 0) return;
    reset(formValues);
    updateEntries.forEach(([k, v]) => {
      switch (k) {
        case "time":
          image.time = new Date(String(v));
          break;
        case "topImage":
        case "pickup":
          switch (v) {
            case "true":
            case "false":
              image[k] = v === "true";
              break;
            default:
              image[k] = null;
              break;
          }
          break;
        case "type":
          if (v !== image.originType) image.setType = v;
          break;
        default:
          image[k] = v;
          break;
      }
    });
    sendUpdate({ image, otherSubmit });
    if ("setType" in image) {
      image.type = image.setType ?? autoImageItemType;
      if (image.setType) image.originType = image.setType;
      else image.originType = image.setType;
      delete image.setType;
    }
  }

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues]);

  const CharaTagsLabel = useCallback(
    ({ option }: { option?: labelValue }) => {
      const chara = charaList.find((chara) => chara.id === option?.value);
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
    [charaList]
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
    () => AutoImageItemType(image?.embed, image?.album?.type),
    [image?.embed, image?.album?.type]
  );

  const [otherTags, setOtherTags] = useState(
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
      <div className="rbButtonArea">
        <button
          title={isEdit ? "保存" : "編集"}
          type="button"
          className="round saveEdit"
          onClick={() => {
            if (isEdit) SubmitImage(image);
            setIsEdit(!isEdit);
          }}
          disabled={isBusy}
        >
          {isEdit ? <MdLibraryAddCheck /> : <AiFillEdit />}
        </button>
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
                  if (
                    image &&
                    (await sendUpdate({ image, deleteMode: true }))
                  ) {
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
                navigator.clipboard.writeText(
                  `![](?image=${image.originName})`
                );
                toast("コピーしました", { duration: 1500 });
              }
            }}
          >
            <MdOutlineContentCopy />
          </button>
        )}
      </div>
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
              name="charaTags"
              labelVisible
              label="キャラクタータグ"
              tags={charaTags}
              control={control}
              setValue={setValue}
              getValues={getValues}
              isBusy={isBusy}
              placeholder="キャラの選択"
            />
          </div>
          <div>
            <EditTagsReactSelect
              name="otherTags"
              labelVisible
              label="その他のタグ"
              tags={otherTags}
              set={setOtherTags}
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
                list="galleryEditEmbedList"
                {...register("embed")}
                disabled={isBusy}
              />
              <datalist id="galleryEditEmbedList">
                {embedList.map((embed, i) => {
                  return (
                    <option key={i} value={embed}>
                      {embed}
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
            <select title="移動" {...register("move")} disabled={isBusy}>
              {imageAlbumList
                .filter((album) => album.listup && !album.name.startsWith("/"))
                .sort((a, b) => ((a.name || "") > (b.name || "") ? 1 : -1))
                .map((album, i) => (
                  <option key={i} value={album.dir}>
                    {album.name}
                  </option>
                ))}
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
          if (isEdit) SubmitImage(image);
        }}
      />
    </>
  );
}
