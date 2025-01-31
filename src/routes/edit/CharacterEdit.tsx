import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { create } from "zustand";
import { UrlObject } from "url";
import { useDataIsComplete } from "@/state/StateSet";
import {
  MdAdd,
  MdCleaningServices,
  MdClose,
  MdDoneOutline,
  MdEditNote,
  MdFileDownload,
  MdFileUpload,
  MdMoreTime,
  MdOutlineImage,
  MdOutlineInsertEmoticon,
  MdOutlineLandscape,
} from "react-icons/md";
import { TbArrowsMove, TbDatabaseImport } from "react-icons/tb";
import { LinkMee } from "@/functions/doc/MakeURL";
import ReactSelect from "react-select";
import { toast } from "react-toastify";
import {
  useCharactersMap,
  useCharacterTags,
  charaMediaKindMap,
} from "@/state/CharacterState";
import { useSounds } from "@/state/SoundState";
import { ImageMeeIcon, ImageMeeQuestion } from "@/layout/ImageMee";
import { callReactSelectTheme } from "@/components/define/callReactSelectTheme";
import {
  CharaBeforeAfter,
  useCharacterPageState,
  useMoveCharacters,
} from "../CharacterPage";
import { IsoFormTime, ToFormTime } from "@/functions/DateFunction";
import { ContentsTagsOption } from "@/components/dropdown/SortFilterTags";
import { EditTagsReactSelect } from "@/components/dropdown/EditTagsReactSelect";
import { RbButtonArea } from "@/components/dropdown/RbButtonArea";
import { fileDialog } from "@/components/FileTool";
import { useApiOrigin, useMediaOrigin } from "@/state/EnvState";
import {
  charactersDataObject,
  ImportCharacterJson,
  imageDataObject,
} from "@/state/DataState";
import {
  iconImagesUploadOptions,
  ImagesUpload,
  ImagesUploadWithToast,
  srcObjectType,
} from "./ImageEditForm";
import { concatOriginUrl } from "@/functions/originUrl";
import { getName } from "@/functions/doc/PathParse";
import { corsFetchJSON } from "@/functions/fetch";
import { useHotkeys } from "react-hotkeys-hook";
import { DropdownObject } from "@/components/dropdown/DropdownMenu";
import { BiBomb } from "react-icons/bi";
import { SendDelete } from "@/functions/sendFunction";
import { DownloadDataObject } from "@/components/button/ObjectDownloadButton";
import { useImageState } from "@/state/ImageState";
import { findMee } from "@/functions/find/findMee";

export function CharacterEdit() {
  const { charaName } = useParams();
  const charactersMap = useCharactersMap()[0];
  const chara = useMemo(
    () => charactersMap?.get(charaName || ""),
    [charactersMap, charaName]
  );
  return (
    <>
      <CharacterEditForm chara={chara} />
    </>
  );
}

function CharacterEditForm({ chara }: { chara?: CharacterType }) {
  const charactersMap = useCharactersMap()[0];
  const apiOrigin = useApiOrigin()[0];
  const nav = useNavigate();
  const setCharactersLoad = charactersDataObject.useLoad()[1];
  const setImagesLoad = imageDataObject.useLoad()[1];
  const { images } = useImageState();
  const characterTags = useCharacterTags()[0];
  const sounds = useSounds()[0];
  const getDefaultValues = useMemo(
    () => ({
      key: chara?.key || "",
      name: chara?.name || "",
      enName: chara?.enName || "",
      nameGuide: chara?.nameGuide || "",
      honorific: chara?.honorific || "",
      overview: chara?.overview || "",
      description: chara?.description || "",
      defEmoji: chara?.defEmoji || "",
      icon: chara?.icon || "",
      image: chara?.image || "",
      headerImage: chara?.headerImage || "",
      time: ToFormTime(chara?.time),
      birthday: ToFormTime(chara?.birthday),
      tags: chara?.tags || [],
      playlist: chara?.playlist || [],
      draft: chara?.draft ?? null,
    }),
    [chara]
  );

  const playlistOptions = useMemo(
    () =>
      [{ label: "デフォルト音楽", value: "default" }].concat(
        (sounds || []).map((s) => ({
          label: s.title || s.key,
          value: s.key,
        }))
      ) as ContentsTagsOption[],
    [sounds]
  );

  const [tagsOptions, setTagsOptions] = useState([] as ContentsTagsOption[]);
  useEffect(() => {
    if (characterTags) setTagsOptions(characterTags);
  }, [characterTags]);

  const schema = z.object({
    key: z
      .string()
      .min(1, { message: "IDは1文字以上必要です！" })
      .refine(
        (key) => {
          return !(
            charactersMap &&
            chara?.key !== key &&
            charactersMap.has(key)
          );
        },
        { message: "既に使用しているIDです！" }
      ),
    name: z.string().min(1, { message: "名前は1文字以上必要です！" }),
  });

  const {
    register,
    reset,
    getValues,
    setValue,
    control,
    handleSubmit,
    formState: { isDirty, errors, dirtyFields },
  } = useForm<FieldValues>({
    values: getDefaultValues,
    resolver: zodResolver(schema),
  });

  const refIsDirty = useRef(false);
  useEffect(() => {
    refIsDirty.current = isDirty;
  }, [isDirty]);
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (refIsDirty.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  async function onSubmit(move?: boolean) {
    const formValues = getValues();
    if (!charactersMap) return;
    const data = {} as KeyValueAnyType;
    Object.entries(formValues).forEach(([key, value]) => {
      if (key in dirtyFields) {
        switch (key as keyof CharacterDataType) {
          case "time":
          case "birthday":
            data[key] = IsoFormTime(value);
            break;
          default:
            data[key] = value;
            break;
        }
      }
    });
    if (Object.values(data).length > 0) {
      if (chara?.key) data.target = chara.key;
      else if (!data.key) data.key = formValues["key"];
      toast
        .promise(
          SendPostFetch({
            apiOrigin,
            data,
          }).then(async (r) => {
            if (r.ok) return r;
            else throw await r.text();
          }),
          {
            pending: "送信中",
            success: {
              render(r) {
                const res = r.data;
                switch (res.status) {
                  case 200:
                    return "キャラクターの更新しました";
                  case 201:
                    return "キャラクターを新たに作成しました";
                  default:
                    return "キャラクターデータが更新されました";
                }
              },
            },
            error: "送信に失敗しました",
          }
        )
        .then(() => {
          setCharactersLoad("no-cache");
          if (move) nav(`/character/${formValues.key}`);
        });
    } else {
      reset();
    }
  }

  const ImageSetter = useCallback(
    (mode: characterImageMode, title = "画像の設定") => {
      return (
        <button
          className={"normal setter" + (chara?.media?.[mode] ? "" : " color")}
          title={title}
          type="button"
          onClick={() => {
            if (chara) {
              fileDialog("image/*")
                .then((fileList) => {
                  const file = fileList.item(0)!;
                  if (mode === "icon") return { src: file, name: chara.key };
                  else return file;
                })
                .then((src) => {
                  return ImagesUploadWithToast({
                    src,
                    apiOrigin,
                    album: charaMediaKindMap.get(mode),
                    albumOverwrite: false,
                    ...(mode === "icon" ? iconImagesUploadOptions : undefined),
                  });
                })
                .then(async (r) => {
                  setImagesLoad("no-cache");
                  return r
                    ? ((await r[0].data) as KeyValueType<unknown>)
                    : null;
                })
                .then(async (o) => {
                  if (o && typeof o.name === "string") {
                    return SendPostFetch({
                      apiOrigin,
                      data: {
                        target: chara.key,
                        [mode]: mode === "icon" ? "" : o.name,
                      },
                    }).then(() => {
                      setCharactersLoad("no-cache");
                    });
                  }
                });
            }
          }}
        >
          {chara?.media?.[mode] ? (
            <ImageMeeIcon className="charaIcon" imageItem={chara.media[mode]} />
          ) : (
            <MdFileUpload />
          )}
        </button>
      );
    },
    [chara]
  );

  useHotkeys(
    "ctrl+enter",
    (e) => {
      if (isDirty) onSubmit(true);
    },
    { enableOnFormTags: true }
  );

  return (
    <>
      <CharaBeforeAfter
        charaName={chara?.key}
        onClick={() => {
          if (isDirty) onSubmit();
        }}
      />
      <form className="edit">
        <div>
          {chara?.media?.icon ? (
            <ImageMeeIcon className="icon" imageItem={chara.media.icon} />
          ) : (
            <ImageMeeQuestion alt={chara?.name} className="icon" />
          )}
        </div>
        <div>
          <input placeholder="キャラクターID" {...register("key")} />
          <label className="ml">
            <input {...register("draft")} type="checkbox" />
            <span>下書き</span>
          </label>
        </div>
        {"key" in errors ? (
          <p className="warm">{errors.key?.message?.toString()}</p>
        ) : null}
        <div className="flex">
          <input placeholder="名前" className="flex-1" {...register("name")} />
          <input placeholder="名前の敬称" {...register("honorific")} />
        </div>
        <div className="flex center">
          <input
            placeholder="ふりがな"
            className="flex-1"
            {...register("nameGuide")}
          />
          <input
            className="mini"
            placeholder="絵文字"
            {...register("defEmoji")}
          />
        </div>
        <div className="flex center">
          <input
            placeholder="英語名"
            className="flex-1"
            {...register("enName")}
          />
        </div>
        {"name" in errors ? (
          <p className="warm">{errors.name?.message?.toString()}</p>
        ) : null}
        <div>
          <textarea placeholder="概要" {...register("overview")} />
        </div>
        <div className="flex column">
          <div className="flex center">
            <label className="inline-flex center flex-1">
              <span className="label-l normal flex center around">
                アイコン
              </span>
              <input
                className="flex-1"
                placeholder="自動設定"
                {...register("icon")}
              />
            </label>
            {ImageSetter("icon", "アイコンの設定")}
          </div>
          <div className="flex center">
            <label className="inline-flex center flex-1">
              <span className="label-l normal flex center around">
                ヘッダー画像
              </span>
              <input
                className="flex-1"
                placeholder="ヘッダー画像"
                {...register("headerImage")}
              />
            </label>
            {ImageSetter("headerImage", "ヘッダーの設定")}
          </div>
          <div className="flex center">
            <label className="inline-flex center flex-1">
              <span className="label-l normal flex center around">
                メイン画像
              </span>
              <input
                className="flex-1"
                placeholder="メイン画像"
                {...register("image")}
              />
            </label>
            {ImageSetter("image", "メイン画像の設定")}
          </div>
        </div>
        <div className="flex column">
          <div className="flex center">
            <label className="inline-flex center flex-1">
              <span className="label-l">できた日</span>
              <input
                className="flex-1"
                placeholder="初めてキャラクターができた日"
                step={1}
                type="datetime-local"
                {...register("time")}
              />
            </label>
            <button
              className="normal setter color"
              title="最も古い投稿から自動的に設定する"
              type="button"
              onClick={() => {
                if (
                  images &&
                  chara &&
                  confirm("最も古い投稿から自動的に設定しますか？")
                ) {
                  const found = findMee(images, {
                    take: 1,
                    orderBy: [{ time: "asc" }],
                    where: { characters: { contains: chara.key } },
                  })[0];
                  if (found) {
                    setValue("time", ToFormTime(found.time), {
                      shouldDirty: true,
                    });
                  }
                }
              }}
            >
              <MdMoreTime />
            </button>{" "}
          </div>
          <label className="flex center">
            <span className="label-l">お誕生日</span>
            <input
              className="flex-1"
              placeholder="キャラクターの誕生日"
              step={1}
              type="datetime-local"
              {...register("birthday")}
            />
          </label>
        </div>
        <div>
          <EditTagsReactSelect
            name="tags"
            tags={tagsOptions}
            set={setTagsOptions}
            control={control}
            setValue={setValue}
            getValues={getValues}
            placeholder="タグ"
            enableEnterAdd
            styles={{
              menuList: (style) => ({ ...style, textAlign: "left" }),
              option: (style) => ({ ...style, paddingLeft: "1em" }),
            }}
          />
        </div>
        <div>
          <Controller
            control={control}
            name="playlist"
            render={({ field }) => (
              <ReactSelect
                instanceId="CharaPlaylistSelect"
                theme={callReactSelectTheme}
                isMulti
                options={playlistOptions}
                styles={{
                  menuList: (style) => ({ ...style, textAlign: "left" }),
                  option: (style) => ({ ...style, paddingLeft: "1em" }),
                }}
                value={(field.value as string[]).map((fv) =>
                  playlistOptions.find(({ value }) => value === fv)
                )}
                placeholder="プレイリスト"
                onChange={(newValues) => {
                  field.onChange(newValues.map((v) => v?.value));
                }}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>
        <div>
          <textarea
            placeholder="詳細"
            className="description"
            {...register("description")}
          />
        </div>
        <div className="flex around wrap">
          <DropdownObject
            MenuButton={<BiBomb />}
            MenuButtonTitle="危険ゾーン"
            MenuButtonClassName="warm"
          >
            <button
              type="button"
              className="squared item"
              disabled={!Boolean(chara)}
              onClick={() => {
                if (chara && confirm("本当に削除しますか？")) {
                  SendDelete({
                    url: concatOriginUrl(apiOrigin, "/character/send"),
                    data: { target: chara.key },
                  }).then((r) => {
                    if (r.ok) {
                      setCharactersLoad("no-cache");
                      nav("/character", { replace: true });
                    }
                  });
                }
              }}
            >
              削除
            </button>
          </DropdownObject>
          <button
            className="color"
            disabled={!isDirty}
            type="reset"
            title="リセット"
            onClick={(e) => {
              e.preventDefault();
              reset();
            }}
          >
            <MdCleaningServices />
          </button>
          <button
            className="color"
            disabled={!isDirty}
            type="button"
            onClick={handleSubmit(() => onSubmit())}
          >
            適用
          </button>
          <button
            className="color"
            disabled={!isDirty}
            type="button"
            onClick={handleSubmit(() => onSubmit(true))}
          >
            送信
          </button>
        </div>
      </form>
    </>
  );
}

export const useEditSwitchState = create<{
  save: boolean;
  reset: boolean;
  sortable: boolean;
  set: (args: { sortable?: boolean; reset?: boolean; save?: boolean }) => void;
}>((set) => ({
  save: false,
  reset: false,
  sortable: false,
  set(args) {
    set(args);
  },
}));

export function CharaEditButton() {
  const apiOrigin = useApiOrigin()[0];
  const isComplete = useDataIsComplete()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
  const charactersMap = useCharactersMap()[0];
  const { charaName } = useParams();
  const [move, setMove] = useMoveCharacters();
  const setCharactersLoad = charactersDataObject.useLoad()[1];
  const { orderBySort } = useCharacterPageState();
  const sortMode = useMemo(
    () => (orderBySort ? orderBySort.length > 0 : false),
    [orderBySort]
  );
  if (!isComplete) return <></>;
  const Url: UrlObject = { pathname: "/character" };
  Url.query = charaName ? { mode: "edit", name: charaName } : { mode: "add" };
  return (
    <RbButtonArea
      dropdown={
        <>
          <button
            type="button"
            className="color round large"
            title="キャラデータのダウンロード"
            onClick={() => {
              if (confirm("キャラクターのJSONデータをダウンロードしますか？"))
                DownloadDataObject(charactersDataObject);
            }}
          >
            <MdFileDownload />
          </button>
          <button
            type="button"
            className="color round large"
            title="キャラクター用のアイコンのインポート"
            onClick={() => {
              fileDialog("image/*", true)
                .then((files) =>
                  Array.from(files).map((src) => {
                    const name = getName(src.name);
                    return {
                      src,
                      character: charactersMap?.has(name) ? name : null,
                    } as srcObjectType;
                  })
                )
                .then((files) =>
                  ImagesUploadWithToast({
                    src: files,
                    apiOrigin,
                    album: charaMediaKindMap.get("icon"),
                    ...iconImagesUploadOptions,
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
            type="button"
            className="color round large"
            title="キャラクターデータベースのインポート"
            onClick={() => {
              ImportCharacterJson({ apiOrigin }).then(() => {
                setCharactersLoad("no-cache-reload");
              });
            }}
          >
            <TbDatabaseImport />
          </button>
        </>
      }
    >
      {charaName || sortMode ? null : move ? (
        <>
          <button
            type="button"
            className="color round"
            title="ソートの中止"
            onClick={() => setMove(0)}
          >
            <MdClose />
          </button>
          <button
            type="button"
            className="color round"
            title="ソートの完了"
            onClick={() => setMove(2)}
          >
            <MdDoneOutline />
          </button>
        </>
      ) : (
        <button
          type="button"
          className="color round large"
          title="ソートモードにする"
          onClick={() => setMove(1)}
        >
          <TbArrowsMove />
        </button>
      )}
      <LinkMee
        to={{ query: { edit: "on" } }}
        className="button color round large"
        title={charaName ? "キャラクターの編集" : "キャラクターの追加"}
      >
        {charaName ? <MdEditNote /> : <MdAdd />}
      </LinkMee>
    </RbButtonArea>
  );
}

interface CharaImageRbButtonsProps {
  image: ImageType | null;
}
export function CharaImageSettingRbButtons({
  image,
}: CharaImageRbButtonsProps) {
  const params = useParams();
  if (params.charaName) {
    const charaName = params.charaName;
    const apiOrigin = useApiOrigin()[0];
    const mediaOrigin = useMediaOrigin()[0];
    const setImagesLoad = imageDataObject.useLoad()[1];
    const setCharactersLoad = charactersDataObject.useLoad()[1];
    async function toastPromise(
      promise: Promise<unknown>,
      mode: characterImageMode
    ) {
      return toast.promise(promise, {
        pending: "送信中",
        success: {
          render() {
            switch (mode) {
              case "icon":
                return "アイコンに設定しました";
              case "headerImage":
                return "ヘッダーに設定しました";
              case "image":
                return "メイン画像に設定しました";
            }
          },
        },
        error: {
          render(e) {
            return String(e.data || "送信に失敗しました");
          },
        },
      });
    }
    async function onClickHandler(mode: characterImageMode) {
      if (image) {
        await toastPromise(
          SendPostFetch({
            apiOrigin,
            data: {
              target: charaName,
              [mode]: image.key,
            },
          }),
          mode
        );
        setCharactersLoad("no-cache");
      }
    }

    return (
      <>
        <button
          type="button"
          className="color round"
          title="キャラクターのアイコンに設定"
          onClick={async () => {
            const src = image ? image.src || image.thumbnail : undefined;
            if (src) {
              toastPromise(
                ImagesUpload({
                  src: {
                    name: charaName,
                    src: concatOriginUrl(mediaOrigin, src),
                  },
                  apiOrigin,
                  album: charaMediaKindMap.get("icon"),
                  ...iconImagesUploadOptions,
                })
                  .then((l) => {
                    const errorFound = l.find((r) => r.status >= 300);
                    if (errorFound) {
                      throw errorFound.data || errorFound.statusText;
                    }
                  })
                  .then(() => {
                    setImagesLoad("no-cache");
                    return SendPostFetch({
                      apiOrigin,
                      data: { target: charaName, icon: "" },
                    });
                  })
                  .then(() => {
                    setCharactersLoad("no-cache");
                  }),
                "icon"
              );
            }
          }}
        >
          <MdOutlineInsertEmoticon />
        </button>
        <button
          type="button"
          className="color round"
          title="キャラクターのヘッダーに設定"
          onClick={() => {
            if (image) onClickHandler("headerImage");
          }}
        >
          <MdOutlineLandscape />
        </button>
        <button
          type="button"
          className="color round"
          title="キャラクターのメイン画像に設定"
          onClick={() => {
            if (image) onClickHandler("image");
          }}
        >
          <MdOutlineImage />
        </button>
      </>
    );
  } else {
    return <></>;
  }
}

interface SendPostFetchProps {
  apiOrigin?: string;
  data: KeyValueAnyType;
}
async function SendPostFetch({ apiOrigin, data }: SendPostFetchProps) {
  return corsFetchJSON(concatOriginUrl(apiOrigin, "character/send"), data);
}
