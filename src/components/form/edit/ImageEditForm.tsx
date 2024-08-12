import {
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GalleryViewerPaging, useImageViewer } from "@/state/ImageViewer";
import { ImageMee } from "@/layout/ImageMee";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useImageState } from "@/state/ImageState";
import {
  defaultGalleryTags,
  getTagsOptions,
  autoFixGalleryTagsOptions,
  ContentsTagsOption,
} from "@/components/dropdown/SortFilterTags";
import { useLocation, useNavigate } from "react-router-dom";
import { useEmbedState } from "@/state/Embed";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { MakeRelativeURL } from "@/functions/doc/MakeURL";
import { AiFillEdit } from "react-icons/ai";
import {
  MdDeleteForever,
  MdLibraryAddCheck,
  MdOutlineContentCopy,
} from "react-icons/md";
import ReactSelect from "react-select";
import { callReactSelectTheme } from "@/theme/main";
import { PostTextarea, usePreviewMode } from "../input/PostTextarea";
import { useCharaState } from "@/state/CharaState";
import { AutoImageItemType } from "../../../data/functions/images";
import { ToFormJST } from "@/functions/DateFormat";
import { create } from "zustand";
import SetRegister from "../hook/SetRegister";
import {
  PostEditSelectDecoration,
  PostEditSelectInsert,
  PostEditSelectMedia,
} from "@/components/dropdown/PostEditSelect";
type labelValue = { label: string; value: string };

interface Props extends HTMLAttributes<HTMLFormElement> {
  image: MediaImageItemType | null;
}
interface ImageEditStateType {
  busy: boolean;
  setBusy: (busy: boolean) => void;
}
type GalleryTagsOptionSet = React.Dispatch<
  React.SetStateAction<ContentsTagsOption[]>
>;

export const useImageEditState = create<ImageEditStateType>((set) => ({
  busy: false,
  setBusy(busy) {
    set({ busy });
  },
}));

export default function ImageEditForm({ className, image, ...args }: Props) {
  const { imageObject, setImageFromUrl } = useImageState();
  const { imageAlbumList, copyrightList } = imageObject;
  const { charaList } = useCharaState();
  const { list: embedList } = useEmbedState();
  const nav = useNavigate();
  const { state, search, pathname } = useLocation();
  const { busy, setBusy } = useImageEditState();
  const refForm = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const getCharaLabelValues = useCallback(() => {
    return charaList.map(({ name, id }) => ({
      label: name,
      value: id,
    }));
  }, [charaList]);

  const isEdit = useMemo(() => state?.edit === "on", [state?.edit]);

  const [charaTags] = useState(getCharaLabelValues());
  const getImageTagsObject = useCallback(
    (image?: MediaImageItemType | null) => {
      const tags = image?.tags || [];
      const imageCharaTags = tags.filter((tag) =>
        charaTags.some((chara) => tag === chara.value)
      );
      const imageOtherTags = tags.filter((tag) =>
        imageCharaTags.every((_tag) => tag !== _tag)
      );
      return { charaTags: imageCharaTags, otherTags: imageOtherTags };
    },
    [charaTags]
  );
  const imageTags = useMemo(() => getImageTagsObject(image), [image]);
  const simpleDefaultTags = useMemo(
    () => autoFixGalleryTagsOptions(getTagsOptions(defaultGalleryTags)),
    [defaultGalleryTags]
  );
  const unregisteredTags = useMemo(
    () =>
      imageTags.otherTags.filter((tag) =>
        simpleDefaultTags.every(({ value }) => value !== tag)
      ),
    [imageTags.otherTags, defaultGalleryTags]
  );
  const getDefaultValues = useCallback(
    (image?: MediaImageItemType | null) => ({
      name: image?.name || "",
      description: image?.description || "",
      topImage: String(image?.topImage),
      pickup: String(image?.pickup),
      ...imageTags,
      type: image?.originType || "",
      time: ToFormJST(image?.time),
      copyright: image?.copyright || [],
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
      setBusy(true);
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
          setBusy(false);
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
  function addTags(field: string, value: string, set: GalleryTagsOptionSet) {
    const newValues = { label: value, value };
    set((c) => c.concat(newValues));
    setValue(field, getValues(field).concat(value), {
      shouldDirty: true,
    });
  }
  function addTagsPrompt(field: string, set: GalleryTagsOptionSet) {
    const answer = prompt("追加するタグの名前を入力してください");
    if (answer !== null) addTags(field, answer, set);
  }
  function addKeydownEnter(
    e: React.KeyboardEvent<HTMLDivElement>,
    field: string,
    set: GalleryTagsOptionSet
  ) {
    if (e.key === "Enter" && !e.ctrlKey) {
      setTimeout(() => {
        const input = e.target as HTMLInputElement;
        const value = input.value;
        if (value) {
          addTags(field, value, set);
          input.blur();
          input.focus();
        }
      }, 50);
    }
  }

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
          disabled={busy}
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
            disabled={busy}
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
                disabled={busy}
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
                disabled={busy}
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
                    isDisabled={busy}
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
                onClick={() => addTagsPrompt("otherTags", setOtherTags)}
                disabled={busy}
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
                    onKeyDown={(e) => {
                      addKeydownEnter(e, "otherTags", setOtherTags);
                    }}
                    onBlur={field.onBlur}
                    isDisabled={busy}
                  />
                )}
              />
            </div>
          </div>
          <div>
            <div className="label">
              <span>版権タグ（コピーライト）</span>
              <button
                title="新規タグ"
                type="button"
                onClick={() => addTagsPrompt("copyright", setCopyrightTags)}
                disabled={busy}
              >
                ＋新規タグの追加
              </button>
            </div>
            <div className="wide">
              <Controller
                control={control}
                name="copyright"
                render={({ field }) => (
                  <ReactSelect
                    instanceId="CopyrightSelect"
                    theme={callReactSelectTheme}
                    isMulti
                    options={copyrightTags}
                    value={(field.value as string[]).map((fv) =>
                      copyrightTags.find((ci) => ci.value === fv)
                    )}
                    placeholder="版権タグ選択"
                    onChange={(newValues) => {
                      field.onChange(newValues.map((v) => v?.value));
                    }}
                    onKeyDown={(e) => {
                      addKeydownEnter(e, "copyright", setCopyrightTags);
                    }}
                    onBlur={field.onBlur}
                    isDisabled={busy}
                  />
                )}
              />
            </div>
          </div>
          <label>
            <span className="label-l">画像の種類</span>
            <select title="種類の選択" {...register("type")} disabled={busy}>
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
                  disabled={busy}
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
                  disabled={busy}
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
                disabled={busy}
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
                disabled={busy}
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
              disabled={busy}
            />
          </label>
          <label>
            <div className="label-l">アルバム移動</div>
            <select title="移動" {...register("move")} disabled={busy}>
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
              disabled={busy}
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
