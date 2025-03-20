import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { CreateObjectState } from "./CreateState";
import { imageDataObject, keyValueDBDataObject } from "./DataState";
import { Modal } from "@/layout/Modal";
import { useApiOrigin, useEnv, useIsLogin } from "./EnvState";
import { RiEdit2Fill, RiImageAddFill } from "react-icons/ri";
import { FieldValues, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import axios from "axios";
import { concatOriginUrl } from "@/functions/originUrl";
import { fileDialog } from "@/components/FileTool";
import { ImagesUploadWithToast } from "@/layout/edit/ImageEditForm";
import { ImageMee, ImageMeeProps } from "@/layout/ImageMee";
import { useImageState, useSelectedImage } from "./ImageState";
import { useLocation, useSearchParams } from "react-router-dom";
import { MultiParser } from "@/components/parse/MultiParser";

export const useKeyValueDB = CreateObjectState<{
  kvData?: KeyValueDBType[];
  kvMap?: Map<string, KeyValueDBType>;
}>();

type EditType = "text" | "textarea" | "image";

export function KeyValueDBState() {
  const { Set } = useKeyValueDB();
  const data = keyValueDBDataObject.useData()[0];
  useEffect(() => {
    if (data) {
      Set({ kvData: data, kvMap: new Map(data.map((v) => [v.key, v])) });
    }
  }, [data]);
  const { edit } = useKeyValueEdit();
  return <>{edit ? <KeyValueEdit /> : null}</>;
}

export const useKeyValueEdit = CreateObjectState<{
  edit: string | null;
  type: EditType;
  default?: string;
}>({ edit: null, type: "text" });

const send = keyValueDBDataObject.options.src + "/send";

function KeyValueEdit() {
  let { state } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const apiOrigin = useApiOrigin()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
  const { imagesMap } = useImageState();
  const {
    edit,
    Set,
    default: defaultValue,
    type: editType,
  } = useKeyValueEdit();
  const { kvMap } = useKeyValueDB();
  const setLoad = keyValueDBDataObject.useLoad()[1];
  const item = useMemo(() => (edit ? kvMap?.get(edit) : null), [kvMap, edit]);
  const value = useMemo(
    () => item?.value || defaultValue,
    [item, defaultValue]
  );
  const {
    register,
    handleSubmit,
    getValues,
    formState: { isDirty, dirtyFields },
  } = useForm<FieldValues>({
    defaultValues: {
      value,
    },
  });
  const Submit = useCallback(() => {
    const values = getValues();
    const entry = Object.fromEntries(
      Object.entries(dirtyFields)
        .filter((v) => v[1])
        .map((v) => [v[0], values[v[0]]])
    );
    entry.key = edit;
    toast.promise(
      axios
        .post(concatOriginUrl(apiOrigin, send), entry, {
          withCredentials: true,
        })
        .then(() => {
          setLoad("no-cache");
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
      axios
        .post(
          concatOriginUrl(apiOrigin, send),
          {
            key: edit,
            value: selectedImage.key,
          },
          {
            withCredentials: true,
          }
        )
        .then((r) => {
          setLoad("no-cache");
        });
      setIsSelectedImage(false);
    }
  }, [selectedImage, isSelectedImage]);

  return (
    <>
      <Modal
        onClose={() => {
          if (!isDirty || confirm("編集中ですが編集画面から離脱しますか？")) {
            Set({ edit: null });
          }
        }}
      >
        <form className="flex" onSubmit={handleSubmit(Submit)}>
          <div>{edit}</div>
          {editType === "text" ? (
            <input
              title="値"
              placeholder={edit || "設定したい値"}
              {...register("value")}
            />
          ) : editType === "textarea" ? (
            <textarea
              title="値"
              placeholder={edit || "設定したい値"}
              {...register("value")}
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
                  style={{ height: "16rem" }}
                  className="overlay flex p-0 m-lr-auto"
                  onClick={() => {
                    fileDialog("image/*")
                      .then((fileList) => fileList.item(0)!)
                      .then((src) => {
                        return ImagesUploadWithToast({
                          src,
                          apiOrigin,
                          album: "images",
                          albumOverwrite: false,
                          notDraft: true,
                          webp: true,
                          thumbnail: false,
                        });
                      })
                      .then(async (r) => {
                        setImagesLoad("no-cache");
                        return r
                          ? ((await r[0].data) as KeyValueType<unknown>)
                          : null;
                      })
                      .then(async (o) => {
                        if (o && typeof o.key === "string") {
                          return axios
                            .post(
                              concatOriginUrl(apiOrigin, send),
                              {
                                key: edit,
                                value: o.key,
                              } as SiteLinkData,
                              {
                                withCredentials: true,
                              }
                            )
                            .then((r) => {
                              setLoad("no-cache");
                            });
                        }
                      });
                  }}
                >
                  {value && imagesMap ? (
                    <ImageMee imageItem={imagesMap.get(value)} />
                  ) : null}
                </button>
              </div>
            </>
          ) : null}
          <button
            type="button"
            className="color"
            onClick={handleSubmit(Submit)}
            disabled={!isDirty}
          >
            送信
          </button>
        </form>
      </Modal>
    </>
  );
}

export interface KeyValueEditableMainProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  editType?: EditType;
  editKey?: string;
  editDefault?: string;
}
export interface KeyValueEditableProps extends KeyValueEditableMainProps {
  editEnvKey?: ImportMetaKVKeyType;
  editEnvDefault?: keyof SiteConfigEnv;
  childrenOutDefault?: boolean;
  childrenOutParse?: boolean;
  replaceValue?: string;
  imageMeeProps?: ImageMeeProps;
}
export function KeyValueEditable({
  children,
  editKey: ek,
  editDefault: ed,
  editEnvKey,
  editEnvDefault,
  childrenOutDefault,
  childrenOutParse,
  replaceValue,
  imageMeeProps,
  ...props
}: KeyValueEditableProps) {
  const env = useEnv()[0];
  const { kvMap } = useKeyValueDB();
  const { editKey, editDefault } = useMemo(
    (() => {
      let editKey = ek;
      let editDefault = ed;
      if (env && kvMap && import.meta.env) {
        if (editEnvKey && !editKey) {
          editKey = import.meta.env[editEnvKey];
        }
        if (editEnvDefault && !editDefault && editKey) {
          editDefault =
            kvMap?.get(editKey)?.value || env[editEnvDefault]?.toString();
        }
      }
      return { editKey, editDefault };
    }) as () => { editKey?: string; editDefault?: string },
    [env, kvMap, ek, ed, editEnvKey, editEnvDefault]
  );
  childrenOutDefault = useMemo(
    () => childrenOutDefault ?? Boolean(editDefault),
    [childrenOutDefault, editDefault]
  );
  childrenOutParse = useMemo(
    () => childrenOutParse ?? props.editType === "textarea",
    [childrenOutParse, props.editType]
  );
  children = useMemo(() => {
    if (!children && childrenOutDefault && editDefault) {
      switch (props.editType) {
        case "image":
          return <ImageMee imageItem={editDefault} {...imageMeeProps} />;
      }
    }
    return children;
  }, [children, props.editType, childrenOutDefault, editDefault]);
  let defaultValue: ReactNode = useMemo(
    () =>
      replaceValue && editDefault
        ? editDefault.replace(/^(.*)$/, replaceValue)
        : editDefault,
    [editDefault, replaceValue]
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
      switch (props.editType || "text") {
        case "text":
        case "textarea":
          return defaultValue;
      }
    }
    return null;
  }, [childrenOutDefault, defaultValue]);
  let defaultAfter = useMemo(() => {
    return null;
  }, [childrenOutDefault, defaultValue]);

  const [isLogin] = useIsLogin();
  return (
    <>
      {defaultBefore}
      {isLogin ? (
        <>
          <KeyValueEditableMain
            editKey={editKey}
            editDefault={editDefault}
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

function KeyValueEditableMain({
  onClick,
  editType = "text",
  editKey,
  editDefault,
  children = <RiEdit2Fill />,
  className = "keyValueEdit",
  ...props
}: KeyValueEditableMainProps) {
  const { Set } = useKeyValueEdit();
  const OnClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (onClick) onClick(e);
      Set({ edit: editKey, default: editDefault, type: editType });
    },
    [onClick, editKey, editDefault, editType]
  );
  return (
    <button className={className} onClick={OnClick} {...props}>
      {children}
    </button>
  );
}
