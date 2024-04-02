import {
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GalleryViewerPaging, useImageViewer } from "./ImageViewer";
import { MediaImageItemType } from "../types/MediaImageDataType";
import { ImageMee } from "../components/layout/ImageMee";
import axios from "axios";
import toast from "react-hot-toast";
import { useImageState } from "./ImageState";
import {
  defaultTags,
  getTagsOptions,
  autoFixTagsOptions,
  GalleryTagsOption,
} from "../components/tag/GalleryTags";
import { useLocation, useNavigate } from "react-router-dom";
import { useEmbedState } from "./Embed";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { MakeRelativeURL } from "../components/doc/MakeURL";
import { AiFillEdit } from "react-icons/ai";
import {
  MdDeleteForever,
  MdLibraryAddCheck,
  MdOutlineContentCopy,
} from "react-icons/md";
import ReactSelect from "react-select";
import { callReactSelectTheme } from "../components/theme/main";
import {
  PostTextarea,
  usePreviewMode,
} from "../components/form/input/PostTextarea";
import { useCharaState } from "./CharaState";
import { AutoImageItemType } from "../data/functions/images";
import { KeyValueStringType } from "../types/ValueType";
type labelValue = { label: string; value: string };

interface Props extends HTMLAttributes<HTMLFormElement> {
  image: MediaImageItemType | null;
}

export default function ImageEditForm({ className, image, ...args }: Props) {
  const { imageAlbumList, copyrightList, setImageFromUrl } = useImageState();
  const { charaList } = useCharaState();
  const { list: embedList } = useEmbedState();
  const nav = useNavigate();
  const { state, search, pathname } = useLocation();
  const refForm = useRef<HTMLFormElement>(null);

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

  const isEdit = useMemo(() => state?.edit === "on", [state?.edit]);

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
      type: image?.originType || "",
      time:
        image?.time
          ?.toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" })
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
        originType,
        setType,
        ..._image
      } = image;
      const res = await axios.patch("/gallery/send", {
        ..._image,
        albumDir: album?.dir,
        type: setType,
        move,
        rename,
        deleteMode,
      });
      if (res.status === 200) {
        toast(deleteMode ? "削除しました" : "更新しました！", {
          duration: 2000,
        });
        setImageFromUrl();
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
    [imageAlbumList, nav, setImageFromUrl]
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
    },
    [isDirty, getValues, defaultValues, reset, sendUpdate]
  );

  const toggleEditParam = useCallback(() => {
    const _state: KeyValueStringType = state ?? {};
    if (_state.edit === "on") delete _state.edit;
    else _state.edit = "on";
    nav(search, {
      state: _state,
      replace: true,
      preventScrollReset: true,
    });
  }, [state, search]);

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
      (defaultTags.find(({ name }) => name === "type")?.options ?? []).map(
        (o) => {
          const v = o.value ?? "";
          const value = v.slice(v.indexOf(":") + 1);
          return { ...o, value };
        }
      ),
    [defaultTags]
  );
  const autoImageItemType = useMemo(
    () => AutoImageItemType(image?.embed, image?.album?.type),
    [image?.embed, image?.album?.type]
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
            toggleEditParam();
          }}
        >
          {isEdit ? <MdLibraryAddCheck /> : <AiFillEdit />}
        </button>
        {isEdit ? (
          <button
            title="削除"
            type="button"
            className="round red"
            onClick={async () => {
              if (confirm("本当に削除しますか？")) {
                if (image && (await sendUpdate({ image, deleteMode: true }))) {
                  if (state) nav(-1);
                  else {
                    nav(pathname, {
                      preventScrollReset: true,
                    });
                  }
                }
              }
            }}
          >
            <MdDeleteForever />
          </button>
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
            toggleEditParam();
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
              />
            </div>
          </label>
          <div>
            <div className="label">
              <span>説明文</span>
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
                registed={register("description")}
              />
            </div>
          </div>
          <div>
            <div className="label">キャラクタータグ</div>
            <div className="wide">
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
            <div className="label">
              <span>その他のタグ</span>
              <button
                title="新規タグ"
                type="button"
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
            <div className="wide">
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
                  />
                )}
              />
            </div>
          </div>
          <label>
            <span className="label-l">画像の種類</span>
            <select title="種類の選択" {...register("type")}>
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
                <select title="トップ画像" {...register("topImage")}>
                  <option value="undefined">自動</option>
                  <option value="true">固定する</option>
                  <option value="false">固定しない</option>
                </select>
              </label>
              <label>
                <span className="label-sl">ピックアップ</span>
                <select title="ピックアップ画像" {...register("pickup")}>
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
              <input title="リンク" type="text" {...register("link")} />
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
            <input title="時間" type="datetime-local" {...register("time")} />
          </label>
          <label>
            <div className="label-l">コピーライト</div>
            <input
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
            <div className="label-l">アルバム移動</div>
            <select title="移動" {...register("move")}>
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
