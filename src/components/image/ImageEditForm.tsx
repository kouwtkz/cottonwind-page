import {
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useImageViewer } from "../../state/ImageViewer";
import { MediaImageItemType } from "../../types/MediaImageDataType";
import ImageMee from "./ImageMee";
import axios from "axios";
import toast from "react-hot-toast";
import { useImageState } from "../../state/ImageState";
import {
  defaultTags,
  getTagsOptions,
  autoFixTagsOptions,
  GalleryTagsOption,
} from "../tag/GalleryTags";
import { useNavigate } from "react-router-dom";
import { useEmbedState } from "../../state/Embed";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { MakeRelativeURL } from "../doc/MakeURL";
import { AiFillEdit } from "react-icons/ai";
import {
  MdDeleteForever,
  MdLibraryAddCheck,
  MdOutlineContentCopy,
} from "react-icons/md";
import ReactSelect from "react-select";
import { callReactSelectTheme } from "../theme/main";
import { PostTextarea, usePreviewMode } from "../form/input/PostTextarea";
import { useCharaState } from "../../state/CharaState";
import { toggleEditParam } from "../doc/SetSearchParams";
type labelValue = { label: string; value: string };

interface Props extends HTMLAttributes<HTMLFormElement> {}

export default function ImageEditForm({ className, ...args }: Props) {
  const { imageAlbumList, imageItemList, copyrightList, setImageFromUrl } =
    useImageState();
  const { charaList } = useCharaState();
  const { list: embedList } = useEmbedState();
  const nav = useNavigate();
  const refForm = useRef<HTMLFormElement>(null);
  const isDev = import.meta.env.DEV;

  const getCharaLabelValues = useCallback(() => {
    return charaList.map(({ name, id }) => ({
      label: name,
      value: id,
    }));
  }, [charaList]);

  const [charaTags, setCharaTags] = useState(getCharaLabelValues());
  const [otherTags, setOtherTags] = useState(
    autoFixTagsOptions(getTagsOptions(defaultTags))
  );
  const { editMode, imageSrc, albumName } = useImageViewer();
  const image = useMemo(() => {
    const albumItemList = albumName
      ? imageItemList.filter(({ album }) => album?.name === albumName)
      : imageItemList;
    return imageSrc
      ? albumItemList.find((image) => image.originName === imageSrc) || null
      : null;
  }, [imageItemList, albumName, imageSrc]);

  const getImageTagsObject = useCallback(
    (image?: MediaImageItemType | null) => {
      const imageCharaTags = (image?.tags || []).filter((tag) =>
        charaTags.some((chara) => tag === chara.value)
      );
      const imageOtherTags = (image?.tags || []).filter((tag) =>
        imageCharaTags.every((_tag) => tag !== _tag)
      );
      return { charaTags: imageCharaTags, otherTags: imageOtherTags };
    },
    [charaTags]
  );

  const getDefaultValues = useCallback(
    (image?: MediaImageItemType | null) => ({
      name: image?.name || "",
      description: image?.description || "",
      topImage: String(image?.topImage),
      pickup: String(image?.pickup),
      ...getImageTagsObject(image),
      time:
        image?.time
          ?.toLocaleString("sv-SE", { timeZone: "JST" })
          .replace(" ", "T") || "",
      copyright: image?.copyright || "",
      link: image?.link || "",
      embed: image?.embed || "",
      move: image?.album?.dir || "",
      rename: image?.originName || "",
    }),
    [getImageTagsObject]
  );

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    control,
    formState: { isDirty, defaultValues },
  } = useForm<FieldValues>({
    defaultValues: getDefaultValues(image),
  });

  const sendUpdate = useCallback(
    async ({
      image,
      deleteMode = false,
      otherSubmit = false,
    }: {
      image: MediaImageItemType;
      deleteMode?: boolean;
      otherSubmit?: boolean;
    }) => {
      const {
        album,
        resized,
        resizeOption,
        URL,
        move,
        rename,
        size,
        type,
        ..._image
      } = image;
      const res = await axios.patch("/gallery/send", {
        ..._image,
        albumDir: album?.dir,
        move,
        rename,
        deleteMode,
      });
      if (res.status === 200) {
        toast(deleteMode ? "削除しました" : "更新しました！", {
          duration: 2000,
        });
        if (!isDev) setImageFromUrl();
        if (!otherSubmit && (move || rename)) {
          const query = Object.fromEntries(
            new URLSearchParams(location.search)
          );
          const movedAlbum = move
            ? imageAlbumList.find((a) => a.dir === move)
            : null;
          if (movedAlbum) query.album = movedAlbum.name;
          if (rename) query.image = rename;
          nav(MakeRelativeURL({ query }), {
            replace: true,
            preventScrollReset: false,
          });
        }
        return true;
      } else {
        return false;
      }
    },
    [imageAlbumList, nav]
  );
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
  const SubmitImage = useCallback(
    async (image?: MediaImageItemType | null, otherSubmit = false) => {
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
          default:
            image[k] = v;
            break;
        }
      });
      sendUpdate({ image, otherSubmit });
    },
    [isDirty, getValues, defaultValues, reset, sendUpdate]
  );

  const refImage = useRef<MediaImageItemType | null>(null);
  useEffect(() => {
    if (image && refImage.current?.URL !== image?.URL) {
      (async () => {
        if (editMode && isDirty) SubmitImage(refImage.current, true);
        const imageDefaultValues = getDefaultValues(image);
        reset(imageDefaultValues);
        setOtherTags((t) => {
          const imageOnlyOtherTags =
            imageDefaultValues.otherTags.filter((item) =>
              t.every(({ value }) => value !== item)
            ) || [];
          if (imageOnlyOtherTags.length > 0)
            return t.concat(
              imageOnlyOtherTags.map((d) => ({ value: d, label: d }))
            );
          else return t;
        });
        refImage.current = image;
      })();
    }
  }, [
    editMode,
    getDefaultValues,
    getValues,
    image,
    imageSrc,
    isDirty,
    SubmitImage,
    reset,
    otherTags,
  ]);

  const CharaTagsLabel = useCallback(
    ({ option }: { option?: labelValue }) => {
      const chara = charaList.find((chara) => chara.id === option?.value);
      return (
        <div>
          <span className="mr-1">
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

  return (
    <>
      <div className="rbButtonArea">
        <button
          title={editMode ? "保存" : "編集"}
          type="button"
          className="round saveEdit"
          onClick={() => {
            if (editMode) SubmitImage(image);
            toggleEditParam({ nav });
          }}
        >
          {editMode ? <MdLibraryAddCheck /> : <AiFillEdit />}
        </button>
        {editMode ? (
          <button
            title="削除"
            type="button"
            className="round red"
            onClick={async () => {
              if (confirm("本当に削除しますか？")) {
                if (image && (await sendUpdate({ image, deleteMode: true }))) {
                  nav(-1);
                  const href = location.href;
                  setTimeout(() => {
                    if (href === location.href)
                      nav(location.pathname, {
                        preventScrollReset: false,
                      });
                  }, 10);
                }
              }
            }}
          >
            <MdDeleteForever />
          </button>
        ) : (
          <button
            title="ブログ用テキストのコピー"
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
      {editMode ? (
        <form
          {...args}
          ref={refForm}
          onSubmit={handleSubmit((e) => {
            toggleEditParam({ nav });
            e.preventDefault();
          })}
          className={"edit window" + (className ? ` ${className}` : "")}
        >
          <label>
            <p>タイトル</p>
            <div className="wide px-1 w-[100%]">
              <input
                className="title block w-[100%] rounded-none px-1 text-xl md:text-2xl text-main-dark"
                title="タイトル"
                type="text"
                {...register("name")}
              />
            </div>
          </label>
          <div>
            <div>
              <span>説明文</span>
              <button
                title="プレビューモードの切り替え"
                type="button"
                className="plain inline-block text-main-strong hover:text-main-dark ml-2 px-2 rounded-lg"
                onClick={() => togglePreviewMode(getValues("description"))}
              >
                {previewMode ? "編集に戻る" : "プレビュー"}
              </button>
            </div>
            <div className="wide">
              <PostTextarea
                title="説明文"
                className="description rounded-none w-[100%] px-1 min-h-[8rem] text-lg md:text-xl"
                registed={register("description")}
              />
            </div>
          </div>
          <div>
            <div>キャラクタータグ</div>
            <div className="px-1 w-[100%]">
              <Controller
                control={control}
                name="charaTags"
                render={({ field }) => (
                  <ReactSelect
                    instanceId="CharaTagSelect"
                    theme={callReactSelectTheme}
                    isMulti
                    options={charaTags}
                    value={(field.value as string[]).map((fv) =>
                      charaTags.find((ci) => ci.value === fv)
                    )}
                    placeholder="キャラの選択"
                    onChange={(newValues) => {
                      field.onChange(newValues.map((v) => v?.value));
                    }}
                    onBlur={field.onBlur}
                    formatOptionLabel={(option) => (
                      <CharaTagsLabel option={option} />
                    )}
                  ></ReactSelect>
                )}
              />
            </div>
          </div>
          <div>
            <div>
              <span>その他のタグ</span>
              <button
                title="新規タグ"
                type="button"
                className="plain inline-block text-main-strong hover:text-main-dark ml-2 px-2 py-1 rounded-lg"
                onClick={() => {
                  const answer = prompt("追加するタグの名前を入力してください");
                  if (answer !== null) {
                    const newCategory = { label: answer, value: answer };
                    setOtherTags((c) => c.concat(newCategory));
                    setValue(
                      "otherTags",
                      getValues("otherTags").concat(answer),
                      {
                        shouldDirty: true,
                      }
                    );
                  }
                }}
              >
                ＋新規タグの追加
              </button>
            </div>
            <div className="px-1 w-[100%]">
              <Controller
                control={control}
                name="otherTags"
                render={({ field }) => (
                  <ReactSelect
                    instanceId="OtherTagsSelect"
                    theme={callReactSelectTheme}
                    isMulti
                    options={otherTags}
                    value={(field.value as string[]).map((fv) =>
                      otherTags.find((ci) => ci.value === fv)
                    )}
                    placeholder="その他のタグ選択"
                    onChange={(newValues) => {
                      field.onChange(newValues.map((v) => v?.value));
                    }}
                    onBlur={field.onBlur}
                  ></ReactSelect>
                )}
              />
            </div>
          </div>
          <div>
            <p>固定設定</p>
            <div className="px-1 w-[100%] flex justify-around">
              <label>
                トップ画像
                <select
                  className="ml-1"
                  title="トップ画像"
                  {...register("topImage")}
                >
                  <option value="undefined">自動</option>
                  <option value="true">固定する</option>
                  <option value="false">固定しない</option>
                </select>
              </label>
              <label>
                ピックアップ
                <select
                  className="ml-1"
                  title="ピックアップ画像"
                  {...register("pickup")}
                >
                  <option value="undefined">自動</option>
                  <option value="true">固定する</option>
                  <option value="false">固定しない</option>
                </select>
              </label>
            </div>
          </div>
          <label>
            <p>リンク</p>
            <div className="mx-1 flex-1">
              <input
                className="rounded-none w-[100%] px-1 text-lg md:text-xl"
                title="リンク"
                type="text"
                {...register("link")}
              />
            </div>
          </label>
          <label>
            <div className="inline-block mr-4">埋め込み</div>
            <input
              className="py-1 px-2 text-lg md:text-xl rounded-md flex-1"
              title="埋め込み"
              type="text"
              list="galleryEditEmbedList"
              {...register("embed")}
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
          </label>
          <label>
            <div className="inline-block mr-4">時間</div>
            <input
              className="rounded-none px-1 text-lg md:text-xl"
              title="時間"
              type="datetime-local"
              {...register("time")}
            />
          </label>
          <label>
            <div className="inline-block mr-4">コピーライト</div>
            <input
              className="py-1 px-2 text-lg md:text-xl rounded-md"
              title="コピーライト"
              type="text"
              list="galleryEditCopyrightList"
              {...register("copyright")}
            />
            <datalist id="galleryEditCopyrightList">
              {copyrightList.map(({ value }, i) => (
                <option value={value} key={i} />
              ))}
            </datalist>
          </label>
          <label>
            <div className="inline-block mr-4">アルバム移動</div>
            <select
              className="py-1 px-2 text-lg md:text-xl rounded-md"
              title="移動"
              {...register("move")}
            >
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
          <label className="flex">
            <div className="inline-block mr-4">ファイル名変更</div>
            <input
              title="ファイル名変更"
              className="flex-1 py-1 px-2 rounded-md"
              {...register("rename")}
            />
          </label>
        </form>
      ) : null}
    </>
  );
}
