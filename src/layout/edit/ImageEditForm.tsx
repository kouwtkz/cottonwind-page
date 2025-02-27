import { HTMLAttributes, useEffect, useMemo, useRef, useState } from "react";
import { GalleryViewerPaging } from "@/layout/ImageViewer";
import { toast } from "react-toastify";
import { useImageState } from "@/state/ImageState";
import {
  defaultGalleryTags,
  getTagsOptions,
  autoFixGalleryTagsOptions,
  ContentsTagsOption,
  addExtentionGalleryTagsOptions,
} from "@/components/dropdown/SortFilterTags";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FieldValues, useController, useForm } from "react-hook-form";
import { AiFillEdit } from "react-icons/ai";
import {
  MdCleaningServices,
  MdDeleteForever,
  MdFileUpload,
  MdLibraryAddCheck,
  MdOndemandVideo,
  MdOutlineContentCopy,
} from "react-icons/md";
import { PostTextarea, usePreviewMode } from "@/components/parse/PostTextarea";
import { useCharacters, useCharactersMap } from "@/state/CharacterState";
import { AutoImageItemType } from "@/functions/media/imageFunction";
import { IsoFormTime, ToFormTime } from "@/functions/DateFunction";
import SetRegister from "@/components/hook/SetRegister";
import {
  PostEditSelectDecoration,
  PostEditSelectInsert,
  PostEditSelectMedia,
} from "@/components/dropdown/PostEditSelect";
import { Options, useHotkeys } from "react-hotkeys-hook";
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
import { CharaImageSettingRbButtons } from "@/routes/edit/CharacterEdit";
import { JoinUnique } from "@/functions/doc/StrFunctions";
import { charaTagsLabel } from "@/components/FormatOptionLabel";
import { corsFetchJSON, methodType } from "@/functions/fetch";
import { concatOriginUrl } from "@/functions/originUrl";
import {
  getCountList,
  PromiseOrder,
  PromiseOrderStateType,
} from "@/functions/arrayFunction";
import { CreateObjectState, CreateState } from "@/state/CreateState";
import { useFiles } from "@/state/FileState";
import axios, { AxiosError, AxiosResponse } from "axios";
import {
  toastLoadingOptions,
  toastUpdateOptions,
} from "@/components/define/toastContainerDef";
import { fileDialog, RenameFile } from "@/components/FileTool";
import { FormToBoolean, FormToNumber } from "@/functions/form/formConvert";
import { CopyWithToast } from "@/functions/toastFunction";
import { ModeSwitch } from "@/layout/edit/CommonSwitch";
import { ImageMee } from "@/layout/ImageMee";
import { useSwipeable } from "react-swipeable";
import { LimitValue } from "@/functions/MathFunction";
import { RegisterRef } from "@/components/hook/SetRef";
import { RiArtboard2Fill, RiFileUploadLine, RiFileWordLine } from "react-icons/ri";

interface Props extends HTMLAttributes<HTMLFormElement> {
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

interface optionElementInterface {
  value?: string;
  inner?: string;
}
const defPositions: optionElementInterface[] = [
  { value: "null", inner: "自動 (中央)" },
  { value: "center top", inner: "上" },
  { value: "center bottom", inner: "下" },
  { value: "left center", inner: "左" },
  { value: "right center", inner: "右" },
  { value: "left top", inner: "左上" },
  { value: "right bottom", inner: "左下" },
  { value: "right top", inner: "右上" },
  { value: "right bottom", inner: "右下" },
];

export default function ImageEditForm({ className, image, ...args }: Props) {
  const { images, imageAlbums: albums } = useImageState();
  const setImagesLoad = imageDataObject.useLoad()[1];
  const copyrightList = useMemo(
    () => getCountList(images || [], "copyright"),
    [images]
  );
  const characters = useCharacters()[0] || [];
  const apiOrigin = useApiOrigin()[0];

  const {
    isEdit: stateIsEdit,
    isDirty: stateIsDirty,
    isBusy,
    Set,
  } = useImageEditState();
  const [stateIsEditHold] = useImageEditSwitchHold();
  const isEdit = useMemo(
    () => stateIsEdit || stateIsEditHold,
    [stateIsEdit, stateIsEditHold]
  );

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
  const allTagsOptions = useMemo(
    () =>
      getCountList(images || [], "tags").map(
        (v) =>
          ({
            label: `${v.value} (${v.count})`,
            value: v.value,
          } as ContentsTagsOption)
      ),
    [images]
  );
  const unregisteredTagsOptions = useMemo(
    () =>
      [
        ...(image?.tags?.map(
          (v) => ({ label: v, value: v } as ContentsTagsOption)
        ) || []),
        ...allTagsOptions,
      ].filter(({ value: tag }) =>
        simpleDefaultTags.every(({ value }) => value !== tag)
      ),
    [image?.tags, defaultGalleryTags, allTagsOptions]
  );
  const values = useMemo(
    () => ({
      title: image?.title || "",
      description: image?.description || "",
      topImage: String(image?.topImage ?? null),
      pickup: String(image?.pickup),
      position: String(image?.position),
      tags: image?.tags || [],
      characters: image?.characters || [],
      type: image?.type || "",
      time: ToFormTime(image?.time),
      copyright: image?.copyright || [],
      link: image?.link || "",
      draft: image?.draft ?? null,
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
    values,
  });

  useEffect(() => {
    if (stateIsDirty !== isDirty) {
      Set({ isDirty });
    }
  }, [stateIsDirty, isDirty]);

  async function SubmitImage({
    deleteMode,
    turnOff = true,
  }: { deleteMode?: boolean; turnOff?: boolean } = {}) {
    Set({ isBusy: true });
    const fields = getValues();
    const data = {} as KeyValueAnyType;
    let method: methodType = "PATCH";
    data.id = image!.id;
    if (deleteMode) method = "DELETE";
    else {
      Object.entries(fields).forEach(([key, value]) => {
        if (dirtyFields[key as keyof typeof values]) {
          switch (key as keyof imageUpdateJsonDataType) {
            case "time":
              data[key] = IsoFormTime(value);
              break;
            case "topImage":
              data[key] = FormToNumber(value);
              break;
            case "pickup":
              data[key] = FormToBoolean(value);
              break;
            default:
              console.log(value);
              value = Array.isArray(value) ? value.join(",") : value;
              if (value === "") data[key] = null;
              else data[key] = value;
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
      Set({ isBusy: false });
    });
    if (res.status === 200) {
      toast.success(deleteMode ? "削除しました" : "更新しました！", {
        autoClose: 2000,
      });
      if (dirtyFields.rename && fields.rename) {
        searchParams.set("image", fields.rename);
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

  const { togglePreviewMode, previewMode } = usePreviewMode();
  function setDescription(v: any) {
    setValue("description", v, {
      shouldDirty: true,
    });
  }

  const TypeTagsOption = useMemo(() => {
    const tags =
      defaultGalleryTags
        .find(({ name }) => name === "type")
        ?.options?.concat() || [];
    return addExtentionGalleryTagsOptions(tags).map((o) => {
      const v = o.value ?? "";
      const value = v.slice(v.indexOf(":") + 1);
      return { ...o, value };
    });
  }, []);
  const autoImageItemType = useMemo(
    () => AutoImageItemType(image?.embed, image?.albumObject?.type),
    [image?.embed, image?.albumObject?.type]
  );

  const [stateTags, setStateTags] = useState<ContentsTagsOption[]>([]);
  const tagsList = useMemo(() => {
    const list = [
      ...autoFixGalleryTagsOptions(getTagsOptions(defaultGalleryTags)),
    ];
    if (stateTags.length > 0)
      list.push({
        label: "追加しようとしたタグ",
        options: stateTags,
      });
    if (unregisteredTagsOptions.length > 0)
      list.push({
        label: "現在ギャラリーにあるタグ",
        options: unregisteredTagsOptions,
      });
    return list;
  }, [defaultGalleryTags, stateTags, unregisteredTagsOptions]);

  const [copyrightTags, setCopyrightTags] = useState(
    copyrightList.map(
      ({ value }) => ({ label: value, value } as ContentsTagsOption)
    )
  );
  const charactersMap = useCharactersMap()[0];
  const charaFormatOptionLabel = useMemo(() => {
    if (charactersMap) return charaTagsLabel(charactersMap);
  }, [charactersMap]);
  const webp = useUploadWebp()[0];
  const thumbnail = !useNoUploadThumbnail()[0];
  const { field: positionField } = useController({
    control,
    name: "position",
  });
  const positionValue = useMemo(
    () => positionField.value,
    [positionField.value]
  );
  const positionOptionList = useMemo(() => {
    const list: optionElementInterface[] = defPositions.concat();
    if (positionValue && list.every((item) => item.value !== positionValue)) {
      list.push({ value: positionValue, inner: positionValue });
    }
    list.push({ value: "any", inner: "任意の値" });
    return list;
  }, [values, positionValue, defPositions]);
  const [isPositionPreview, SetPositionPreview] = useState(false);
  const previewImgStyle = useMemo(() => {
    let style: React.CSSProperties | undefined;
    if (positionValue) {
      style = {};
      if (positionValue && positionValue !== "null") {
        style.objectPosition = positionValue;
      }
    }
    return style;
  }, [positionValue]);

  const positionSelectRef = useRef<HTMLSelectElement>();
  const { refPassthrough: psRefPassthrough, registered: registerPosition } =
    RegisterRef({
      useRefValue: positionSelectRef,
      registerValue: register("position"),
    });

  const positionPreviewRef = useRef<HTMLDivElement>();
  const ppRefPassthrough = (el: HTMLDivElement) => {
    positionPreviewHandlers.ref(el);
    positionPreviewRef.current = el;
  };
  useEffect(() => {
    if (isEdit && positionSelectRef.current)
      positionSelectRef.current.value = getValues("position");
  }, [isEdit]);
  function setPositionSelect(value: string | null) {
    if (value) {
      setValue("position", value, { shouldDirty: true });
      new Promise((r) => r(null)).then(() => {
        if (positionSelectRef.current) positionSelectRef.current.value = value;
      });
    } else {
      setValue("position", positionField.value);
    }
  }
  function replacePositionToPercent(value: any) {
    let _v = String(value);
    if (_v === "null") return "50% 50%";
    else {
      return _v
        .replaceAll("center", "50%")
        .replace("top", "0%")
        .replace("bottom", "100%")
        .replace("left", "0%")
        .replace("right", "100%");
    }
  }
  function movePosition({
    x,
    y,
    moving = false,
  }: {
    x?: number;
    y?: number;
    moving?: boolean;
  }) {
    const str = replacePositionToPercent(positionField.value);
    let [sx, sy] = str.split(" ");
    if (x)
      sx = sx.replace(/[\-\.\d]+/, (m) =>
        String(LimitValue(Number(m) + Math.round(x), { min: 0, max: 100 }))
      );
    if (y)
      sy = sy.replace(/[\-\.\d]+/, (m) =>
        String(LimitValue(Number(m) + Math.round(y), { min: 0, max: 100 }))
      );
    const value = [sx, sy].join(" ");
    if (moving) setValue("position", value);
    else setPositionSelect(value);
  }
  const positionPreviewHandlers = useSwipeable({
    onSwiping: (event) => {
      movePosition({
        x: -event.deltaX / 10,
        y: -event.deltaY / 10,
        moving: true,
      });
    },
    onSwiped: (event) => {
      movePosition({ x: -event.deltaX / 10, y: -event.deltaY / 10 });
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    touchEventOptions: { passive: false },
  });
  useEffect(() => {
    if (isPositionPreview) {
      positionPreviewRef.current?.focus();
    }
  }, [isPositionPreview]);
  const enabledPP = isEdit && isPositionPreview;
  const optionsPP: Options = { enabled: enabledPP, preventDefault: true };
  useHotkeys(
    "ArrowLeft",
    () => {
      movePosition({ x: -1 });
    },
    optionsPP
  );
  useHotkeys(
    "ArrowRight",
    () => {
      movePosition({ x: 1 });
    },
    optionsPP
  );
  useHotkeys(
    "ArrowUp",
    () => {
      movePosition({ y: -1 });
    },
    optionsPP
  );
  useHotkeys(
    "ArrowDown",
    () => {
      movePosition({ y: 1 });
    },
    optionsPP
  );

  return (
    <>
      <RbButtonArea
        dropdown={
          <>
            <button
              title="画像を置き換える"
              type="button"
              className="color round rb"
              onClick={() => {
                if (image)
                  fileDialog("image/*")
                    .then((files) => files.item(0)!)
                    .then((file) =>
                      ImagesUploadWithToast({
                        src: { src: file, name: image.key },
                        apiOrigin,
                        webp,
                        thumbnail,
                      })
                    )
                    .then(() => {
                      setImagesLoad("no-cache");
                    });
              }}
            >
              <MdFileUpload />
            </button>
            <button
              title="サムネイルをアップロードする"
              type="button"
              className="color round rb"
              onClick={() => {
                if (image)
                  fileDialog("image/*")
                    .then((files) => files.item(0)!)
                    .then((file) =>
                      ImagesUploadWithToast({
                        src: { src: file, name: image.key },
                        original: false,
                        thumbnail: true,
                        apiOrigin,
                      })
                    )
                    .then(() => {
                      setImagesLoad("no-cache");
                    });
              }}
            >
              <MdOndemandVideo />
            </button>
            <button
              title="画像名のテキストコピー"
              type="button"
              className="color round rb"
              onClick={() => {
                if (image) CopyWithToast(image.key);
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
              onClick={(e) => {
                e.preventDefault();
                reset();
              }}
              disabled={isBusy || !isDirty}
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
            Set({ isEdit: !isEdit });
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
            Set({ isEdit: !isEdit });
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
                {...register("title")}
                disabled={isBusy}
              />
            </div>
          </label>
          <div>
            <div className="label">
              <span>説明文</span>
              <PostEditSelectMedia
                textarea={textareaRef.current}
                setValue={setDescription}
              />
              <PostEditSelectDecoration
                textarea={textareaRef.current}
                setValue={setDescription}
              />
              <PostEditSelectInsert
                textarea={textareaRef.current}
                setValue={setDescription}
              />
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
              tags={tagsList}
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
            <div className="flex wrap mb-1">
              <label className="ml">
                <span className="label-sl">トップ画像</span>
                <select
                  title="トップ画像"
                  {...register("topImage")}
                  disabled={isBusy}
                >
                  <option value="null">自動</option>
                  <option value="1">トップ表示に含める</option>
                  <option value="2">アクセス時に表示する</option>
                  <option value="3">常に表示する</option>
                  <option value="4">時間帯でトップへ含む</option>
                  <option value="5">時間帯アクセス時表示</option>
                  <option value="6">時間帯で常に表示する</option>
                  <option value="0">表示しない</option>
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
            <div className="flex wrap mb-1">
              <label className="ml">
                <span className="label-sl">画像の中心</span>
                <select
                  title="画像の中心"
                  {...registerPosition}
                  ref={psRefPassthrough}
                  disabled={isBusy}
                  onChange={(e) => {
                    SetPositionPreview(true);
                    if (positionSelectRef.current?.value === "any") {
                      const promptDefault: string = replacePositionToPercent(
                        positionField.value
                      );
                      const inputValue = prompt(
                        "画像の中心を入力してください (object-position)",
                        promptDefault
                      );
                      setPositionSelect(inputValue);
                    } else {
                      positionField.onChange(e);
                    }
                  }}
                >
                  {positionOptionList.map(({ value, inner }, k) => (
                    <option value={value} key={k}>
                      {inner}
                    </option>
                  ))}
                </select>
              </label>
              <div className="positionPreview label">
                {image ? (
                  <div
                    hidden={!isPositionPreview}
                    className="window"
                    tabIndex={-1}
                    {...positionPreviewHandlers}
                    ref={ppRefPassthrough}
                  >
                    <ImageMee
                      imageItem={image}
                      mode="simple"
                      className="vertical"
                      autoPosition={false}
                      style={previewImgStyle}
                    />
                    <div>
                      <ImageMee
                        imageItem={image}
                        mode="simple"
                        className="square"
                        autoPosition={false}
                        style={previewImgStyle}
                      />
                      <ImageMee
                        imageItem={image}
                        mode="simple"
                        className="landscape"
                        autoPosition={false}
                        style={previewImgStyle}
                      />
                    </div>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    SetPositionPreview(!isPositionPreview);
                  }}
                >
                  {isPositionPreview ? "▼プレビューを閉じる" : "▲プレビュー"}
                </button>
              </div>
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
  const url = concatOriginUrl(apiOrigin, "/image/send");
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
      const filename =
        typeof object.src === "object" ? object.src.name : object.src;
      const basename = getName(object.name);
      const ext = getExtension(filename);
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
            const resizeProps: resizeImageCanvasProps = {
              image,
              size: thumbnailSize,
              type: "webp",
              expansion: false,
            };
            if (imageOverSizeCheck(image, resizeProps.size!)) {
              formData.append(
                "thumbnail",
                await resizeImageCanvas({ ...resizeProps, quality: 0.8 }),
                webpName
              );
            } else if (ext === "gif" || !original) {
              formData.append(
                "thumbnail",
                await resizeImageCanvas({
                  ...resizeProps,
                  imageSmoothingEnabled: false,
                }),
                webpName
              );
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
        timeout: 10000,
      }).catch((e: AxiosError) => {
        const stock: unknown[] = [];
        if (e.config?.data) {
          const data = Object.fromEntries(e.config.data);
          if (data.file?.name) stock.push(data.file.name);
          stock.push(data);
        }
        stock.push(e);
        console.error(...stock);
        if (e.response) return e.response;
        else return { status: 500 } as AxiosResponse;
      })
  );
}

export interface ImagesUploadProps extends MakeImagesUploadListProps {
  sleepTime?: number;
}
export async function ImagesUploadWithToast({
  sleepTime = 10,
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
          render: "アップロードに失敗したファイルが含まれています",
          type: "error",
        });
      });
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
