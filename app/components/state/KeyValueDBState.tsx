import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useLocation, useSearchParams } from "react-router";
import { CreateObjectState } from "./CreateState";
import {
  apiOrigin,
  imageDataIndexed,
  keyValueDBDataIndexed,
} from "~/data/ClientDBLoader";
import { Modal } from "~/components/layout/Modal";
import { useEnv, useIsLogin } from "./EnvState";
import {
  RiEdit2Fill,
  RiGitRepositoryPrivateLine,
  RiImageAddFill,
} from "react-icons/ri";
import { type FieldValues, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { fileDialog } from "~/components/utils/FileTool";
import { ImagesUploadWithToast } from "~/components/layout/edit/ImageEditForm";
import { ImageMee, type ImageMeeProps } from "~/components/layout/ImageMee";
import { useSelectedImage } from "./ImageState";
import {
  MultiParserWithMedia as MultiParser,
  type MultiParserWithMediaProps,
} from "~/components/parse/MultiParserWithMedia";
import { TextareaWithPreview } from "~/components/parse/PostTextarea";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { OmittedEnv } from "types/custom-configuration";
import { customFetch } from "../functions/fetch";
import { ExternalStoreProps } from "~/data/IndexedDB/IndexedDataLastmodMH";
import { GetAPIFromOptions, KeyValueDBDataOptions } from "~/data/DataEnv";
import { useHotkeys } from "react-hotkeys-hook";

const SEND_API = GetAPIFromOptions(KeyValueDBDataOptions, "/send");

export const useKeyValueDB = CreateObjectState<{
  kvList?: KeyValueDBType[];
  kvMap?: Map<string, KeyValueDBType>;
  isLoading: boolean;
}>({ isLoading: true });

type EditType = "text" | "textarea" | "image";

export function KeyValueDBState() {
  const { Set } = useKeyValueDB();
  const data = useSyncExternalStore(
    ...ExternalStoreProps(keyValueDBDataIndexed)
  );
  useEffect(() => {
    if (data?.db) {
      data.getAll().then((items) => {
        const parsedData = items.map(({ private: p, ...props }) => ({
          private: Boolean(p),
          ...props,
        }));
        Set({
          kvList: parsedData,
          kvMap: new Map(
            parsedData.filter((v) => v.key).map((v) => [v.key!, v])
          ),
          isLoading: false,
        });
      });
    }
  }, [data]);
  const { edit } = useKeyValueEdit();
  return <>{edit ? <KeyValueEdit /> : null}</>;
}

export const useKeyValueEdit = CreateObjectState<{
  edit: string | null;
  type: EditType;
  default?: string;
  title?: string;
  placeholder?: string;
  isFirstSelection?: boolean;
}>({ edit: null, type: "text" });

const schema = z.object({
  value: z.string().nullish(),
  private: z.boolean().nullish(),
});
function KeyValueEdit() {
  const ref = useRef<HTMLFormElement | null>(null);
  let { state } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  let {
    edit,
    Set,
    default: defaultValue,
    type: editType,
    title = "値",
    placeholder,
    isFirstSelection,
  } = useKeyValueEdit();
  useEffect(() => {
    const textElement = ref.current?.querySelector<
      HTMLTextAreaElement | HTMLInputElement
    >(`textarea,input[type="text"]`);
    if (textElement) {
      textElement.focus();
      if (isFirstSelection) {
        textElement.setSelectionRange(0, 0);
        textElement.scrollTo(0, 0);
      }
    }
  }, [isFirstSelection]);
  placeholder = useMemo(
    () => placeholder || edit || "設定したい値",
    [placeholder, edit]
  );
  const { kvMap } = useKeyValueDB();
  const item = useMemo(() => {
    const data = edit ? kvMap?.get(edit) : null;
    return data;
  }, [kvMap, edit]);
  const values = useMemo(
    () => ({
      value: item?.value || defaultValue,
      private: item?.private ?? null,
    }),
    [item, defaultValue]
  );
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { isDirty, dirtyFields },
  } = useForm<any>({
    defaultValues: values,
    resolver: zodResolver(schema),
  });
  const Reset = useCallback(() => {
    reset();
  }, []);
  const Delete = useCallback(() => {
    if (edit && confirm("本当に削除しますか？\n(デフォルトの設定に戻ります)")) {
      customFetch(concatOriginUrl(apiOrigin, SEND_API), {
        method: "DELETE",
        data: { key: edit },
        cors: true,
      }).then(() => {
        toast.success("削除しました");
        keyValueDBDataIndexed.load("no-cache");
        Set({ edit: null });
      });
    }
  }, [edit]);
  const Submit = useCallback(() => {
    const values = getValues();
    const entry = Object.fromEntries(
      Object.entries(dirtyFields)
        .filter((v) => v[1])
        .map((v) => [v[0], values[v[0]]])
    );
    entry.key = edit;
    toast.promise(
      customFetch(concatOriginUrl(apiOrigin, SEND_API), {
        data: entry,
        method: "POST",
        cors: true,
      }).then(() => {
        keyValueDBDataIndexed.load("no-cache");
        Set({ edit: null });
      }),
      {
        pending: "送信中",
        success: "送信しました",
        error: "送信に失敗しました",
      }
    );
  }, [item, dirtyFields]);

  const [isSelectedImage, setIsSelectedImage] = useState<boolean>();
  const selectedImage = useSelectedImage()[0];
  useEffect(() => {
    if (selectedImage && isSelectedImage) {
      customFetch(concatOriginUrl(apiOrigin, SEND_API), {
        data: {
          key: edit,
          value: selectedImage.key,
        },
        method: "POST",
        cors: true,
      }).then((r) => {
        keyValueDBDataIndexed.load("no-cache");
      });
      setIsSelectedImage(false);
    }
  }, [selectedImage, isSelectedImage]);

  useHotkeys(
    "ctrl+enter",
    (e) => {
      if (isDirty) Submit();
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

  return (
    <>
      <Modal
        className="keyValueEdit"
        onClose={() => {
          if (!isDirty || confirm("編集中ですが編集画面から離脱しますか？")) {
            Set({ edit: null });
          }
        }}
      >
        <form className="flex" onSubmit={handleSubmit(Submit)} ref={ref}>
          <div className="header flex justify-between">
            <span>{edit}</span>
            <label className="private">
              <input {...register("private")} type="checkbox" title="非公開" />
              <RiGitRepositoryPrivateLine />
            </label>
          </div>
          {editType === "text" ? (
            <input
              title="値"
              placeholder={edit || "設定したい値"}
              type="text"
              {...register("value")}
            />
          ) : editType === "textarea" ? (
            <TextareaWithPreview
              name="value"
              {...{ title, placeholder, watch: getValues, setValue, register }}
            />
          ) : editType === "image" ? (
            <>
              <div className="setterImage">
                <button
                  title="アルバムから画像を設定する"
                  type="button"
                  className="selectGallery translucent-button"
                  onClick={() => {
                    if (!state) state = {};
                    state.from = location.href;
                    const newSearchParams = new URLSearchParams(searchParams);
                    newSearchParams.set("modal", "gallery");
                    newSearchParams.set("showAllAlbum", "on");
                    setSearchParams(Object.fromEntries(newSearchParams), {
                      state,
                      preventScrollReset: true,
                    });
                    setIsSelectedImage(true);
                  }}
                >
                  <RiImageAddFill />
                </button>
                <button
                  title="画像の設定"
                  type="button"
                  className="overlay flex p-0 m-lr-auto"
                  onClick={() => {
                    fileDialog("image/*")
                      .then((fileList) => fileList.item(0)!)
                      .then((src) => {
                        return ImagesUploadWithToast({
                          src,
                          album: "images",
                          albumOverwrite: false,
                          notDraft: true,
                          webp: true,
                          thumbnail: false,
                        });
                      })
                      .then((r) => {
                        imageDataIndexed.load("no-cache");
                        return (r?.[0].data || null) as ImageDataType | null;
                      })
                      .then(async (o) => {
                        if (o && typeof o.key === "string") {
                          return customFetch(
                            concatOriginUrl(apiOrigin, SEND_API),
                            {
                              data: {
                                key: edit,
                                value: o.key,
                              } as SiteLinkData,
                              method: "POST",
                              cors: true,
                            }
                          ).then((r) => {
                            keyValueDBDataIndexed.load("no-cache");
                          });
                        }
                      });
                  }}
                >
                  <ImageMee imageItem={values.value} />
                </button>
              </div>
            </>
          ) : null}
          <div className="actions">
            <button type="button" className="color-warm" onClick={Delete}>
              削除
            </button>
            <button type="button" onClick={Reset} disabled={!isDirty}>
              リセット
            </button>
            <button
              type="button"
              onClick={handleSubmit(Submit, (e) => {
                console.log(e);
              })}
              disabled={!isDirty}
            >
              送信
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export interface KeyValueEditableBaseProps {
  editType?: EditType;
  editKey?: string;
  editDefault?: string;
  isFirstSelection?: boolean;
}
export interface KeyValueEditableMainProps
  extends React.HTMLAttributes<HTMLButtonElement>,
    KeyValueEditableBaseProps {
  title?: string;
  placeholder?: string;
}
export interface KeyValueEditableBaseCaseEnvProps {
  editEnvKey?: ImportMetaKVKeyType;
  editEnvDefault?: keyof OmittedEnv;
}
export interface KeyValueEditableProps
  extends KeyValueEditableMainProps,
    KeyValueEditableBaseCaseEnvProps {
  childrenOutDefault?: boolean;
  childrenOutParse?: boolean;
  replaceValue?: string;
  imageMeeProps?: ImageMeeProps;
}

interface getKeyValueFromEnvKeyProps
  extends KeyValueEditableBaseProps,
    KeyValueEditableBaseCaseEnvProps {
  env?: Partial<OmittedEnv>;
  kvMap?: Map<string, KeyValueDBType>;
}
export function getKeyValueFromEnvKey({
  env,
  kvMap,
  editKey,
  editDefault,
  editEnvKey,
  editEnvDefault,
}: getKeyValueFromEnvKeyProps) {
  let useKey = editKey;
  let value = editDefault;
  if (env && kvMap && import.meta.env) {
    if (editEnvKey && !useKey) {
      useKey = import.meta.env[editEnvKey];
    }
    if (!value && useKey) {
      value =
        kvMap?.get(useKey)?.value ||
        (editEnvDefault ? env[editEnvDefault]?.toString() : "");
    }
  }
  return { useKey, value };
}

export function KeyValueEditable({
  children,
  editType,
  editKey,
  editDefault,
  editEnvKey,
  editEnvDefault,
  childrenOutDefault,
  childrenOutParse,
  replaceValue,
  imageMeeProps,
  title,
  ...props
}: KeyValueEditableProps) {
  const env = useEnv()[0];
  const { kvMap } = useKeyValueDB();
  const isLogin = useIsLogin()[0];
  const { useKey, value } = useMemo(
    () =>
      getKeyValueFromEnvKey({
        env,
        kvMap,
        editKey,
        editDefault,
        editEnvKey,
        editEnvDefault,
      }),
    [env, kvMap, editKey, editDefault, editEnvKey, editEnvDefault]
  );
  childrenOutDefault = useMemo(
    () => childrenOutDefault ?? Boolean(value),
    [childrenOutDefault, value]
  );
  childrenOutParse = useMemo(
    () => childrenOutParse ?? editType === "textarea",
    [childrenOutParse, editType]
  );
  children = useMemo(() => {
    if (!children && childrenOutDefault && value) {
      switch (editType) {
        case "image":
          return <ImageMee imageItem={value} {...imageMeeProps} />;
      }
    }
    return (
      children ||
      (isLogin ? (
        <>
          <RiEdit2Fill />
          {title ? <span className="title">{title}</span> : null}
        </>
      ) : null)
    );
  }, [children, editType, title, childrenOutDefault, value, isLogin]);
  let defaultValue: ReactNode = useMemo(
    () =>
      replaceValue && value ? value.replace(/^(.*)$/, replaceValue) : value,
    [value, replaceValue]
  );
  defaultValue = useMemo(
    () =>
      childrenOutParse ? (
        <MultiParser>{defaultValue}</MultiParser>
      ) : (
        defaultValue
      ),
    [defaultValue, childrenOutParse]
  );
  let defaultBefore = useMemo(() => {
    if (childrenOutDefault) {
      switch (editType || "text") {
        case "text":
          return defaultValue;
      }
    }
    return null;
  }, [childrenOutDefault, defaultValue]);
  let defaultAfter = useMemo(() => {
    switch (editType || "text") {
      case "textarea":
        return defaultValue;
    }
    return null;
  }, [childrenOutDefault, defaultValue]);

  return (
    <>
      {defaultBefore}
      {isLogin ? (
        <>
          <KeyValueEditableMain
            {...{ editKey: useKey, editDefault: value, title, editType }}
            {...props}
          >
            {children}
          </KeyValueEditableMain>
        </>
      ) : (
        children
      )}
      {defaultAfter}
    </>
  );
}

interface KeyValueRenderProps
  extends KeyValueEditableBaseProps,
    KeyValueEditableBaseCaseEnvProps,
    MultiParserWithMediaProps {
  childrenOutParse?: boolean;
  onRender?: (elm: HTMLElement) => void;
}
export function KeyValueRenderProps({
  editType,
  childrenOutParse,
  onRender,
  ...props
}: KeyValueRenderProps) {
  const env = useEnv()[0];
  const { kvMap } = useKeyValueDB();
  childrenOutParse = childrenOutParse ?? editType === "textarea";
  const { value } = useMemo(
    () => getKeyValueFromEnvKey({ env, kvMap, ...props }),
    [env, kvMap, props]
  );
  return (
    <>
      {childrenOutParse ? (
        <MultiParser onRender={onRender} {...props}>
          {value}
        </MultiParser>
      ) : (
        value
      )}
    </>
  );
}

interface KeyValueEditButtonProps
  extends KeyValueEditableBaseProps,
    KeyValueEditableBaseCaseEnvProps {
  children?: ReactNode;
}
export function KeyValueEditButton({
  children,
  ...props
}: KeyValueEditButtonProps) {
  const env = useEnv()[0];
  const { kvMap } = useKeyValueDB();
  const { useKey, value } = useMemo(
    () => getKeyValueFromEnvKey({ env, kvMap, ...props }),
    [env, kvMap, props]
  );
  const isLogin = useIsLogin()[0];
  return (
    <>
      {isLogin ? (
        <KeyValueEditableMain
          editKey={useKey}
          editDefault={value}
          editType={props.editType}
          isFirstSelection={props.isFirstSelection}
        >
          {typeof children === "object" ? (
            children
          ) : (
            <>
              <RiEdit2Fill />
              {children}
            </>
          )}
        </KeyValueEditableMain>
      ) : null}
    </>
  );
}

function KeyValueEditableMain({
  onClick,
  editType = "text",
  editKey,
  editDefault,
  children,
  className = "keyValueEdit",
  title,
  placeholder,
  isFirstSelection,
  ...props
}: KeyValueEditableMainProps) {
  const { Set } = useKeyValueEdit();
  const OnClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (onClick) onClick(e);
      Set({
        edit: editKey,
        default: editDefault,
        type: editType,
        title,
        placeholder,
        isFirstSelection,
      });
    },
    [
      onClick,
      editKey,
      editDefault,
      editType,
      title,
      placeholder,
      isFirstSelection,
    ]
  );
  return (
    <button className={className} onClick={OnClick} {...props}>
      {children}
    </button>
  );
}
