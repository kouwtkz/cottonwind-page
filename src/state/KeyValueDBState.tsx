import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { CreateObjectState } from "./CreateState";
import { imageDataObject, keyValueDBDataObject } from "./DataState";
import { Modal } from "@/layout/Modal";
import { useApiOrigin, useEnv, useIsLogin } from "./EnvState";
import {
  RiEdit2Fill,
  RiGitRepositoryPrivateLine,
  RiImageAddFill,
} from "react-icons/ri";
import { FieldValues, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import axios from "axios";
import { concatOriginUrl } from "@/functions/originUrl";
import { fileDialog } from "@/components/FileTool";
import { ImagesUploadWithToast } from "@/layout/edit/ImageEditForm";
import { ImageMee, ImageMeeProps } from "@/layout/ImageMee";
import { useImageState, useSelectedImage } from "./ImageState";
import { useLocation, useSearchParams } from "react-router-dom";
import { MultiParserWithMedia as MultiParser } from "@/components/parse/MultiParserWithMedia";
import { TextareaWithPreview } from "@/components/parse/PostTextarea";

export const useKeyValueDB = CreateObjectState<{
  kvList?: KeyValueDBType[];
  kvMap?: Map<string, KeyValueDBType>;
}>();

type EditType = "text" | "textarea" | "image";

export function KeyValueDBState() {
  const { Set } = useKeyValueDB();
  const data = keyValueDBDataObject.useData()[0];
  useEffect(() => {
    if (data) {
      const parsedData = data.map(({ private: p, ...props }) => ({
        private: Boolean(p),
        ...props,
      }));
      Set({
        kvList: parsedData,
        kvMap: new Map(parsedData.filter((v) => v.key).map((v) => [v.key!, v])),
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
}>({ edit: null, type: "text" });

const send = keyValueDBDataObject.options.src + "/send";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  value: z.string().nullish(),
  private: z.boolean().nullish(),
});
function KeyValueEdit() {
  let { state } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const apiOrigin = useApiOrigin()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
  const { imagesMap } = useImageState();
  let {
    edit,
    Set,
    default: defaultValue,
    type: editType,
    title = "値",
    placeholder,
  } = useKeyValueEdit();
  placeholder = useMemo(
    () => placeholder || edit || "設定したい値",
    [placeholder, edit]
  );
  const { kvMap } = useKeyValueDB();
  const setLoad = keyValueDBDataObject.useLoad()[1];
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
  } = useForm<FieldValues>({
    defaultValues: values,
    resolver: zodResolver(schema),
  });
  const Reset = useCallback(() => {
    reset();
  }, []);
  const Delete = useCallback(() => {
    if (edit && confirm("本当に削除しますか？\n(デフォルトの設定に戻ります)")) {
      axios
        .delete(concatOriginUrl(apiOrigin, send), { data: { key: edit } })
        .then(() => {
          toast.success("削除しました");
          setLoad("no-cache");
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
        className="keyValueEdit"
        onClose={() => {
          if (!isDirty || confirm("編集中ですが編集画面から離脱しますか？")) {
            Set({ edit: null });
          }
        }}
      >
        <form className="flex" onSubmit={handleSubmit(Submit)}>
          <div className="header">
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
              {...register("value")}
            />
          ) : editType === "textarea" ? (
            <TextareaWithPreview
              name="value"
              {...{ title, placeholder, getValues, setValue, register }}
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
                  {values.value && imagesMap ? (
                    <ImageMee imageItem={imagesMap.get(values.value)} />
                  ) : null}
                </button>
              </div>
            </>
          ) : null}
          <div className="actions">
            <button type="button" className="color-warm" onClick={Delete}>
              削除
            </button>
            <button
              type="button"
              className="color"
              onClick={Reset}
              disabled={!isDirty}
            >
              リセット
            </button>
            <button
              type="button"
              className="color"
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

export interface KeyValueEditableMainProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  editType?: EditType;
  editKey?: string;
  editDefault?: string;
  title?: string;
  placeholder?: string;
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
  title,
  ...props
}: KeyValueEditableProps) {
  const env = useEnv()[0];
  const isLogin = useIsLogin()[0];
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
    return (
      children ||
      (isLogin ? (
        <>
          <RiEdit2Fill />
          <span className="title">{title}</span>
        </>
      ) : null)
    );
  }, [
    children,
    props.editType,
    title,
    childrenOutDefault,
    editDefault,
    isLogin,
  ]);
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
          return defaultValue;
      }
    }
    return null;
  }, [childrenOutDefault, defaultValue]);
  let defaultAfter = useMemo(() => {
    switch (props.editType || "text") {
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
          <KeyValueEditableMain {...{ editKey, editDefault, title }} {...props}>
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
  children,
  className = "keyValueEdit",
  title,
  placeholder,
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
      });
    },
    [onClick, editKey, editDefault, editType, title, placeholder]
  );
  return (
    <button className={className} onClick={OnClick} {...props}>
      {children}
    </button>
  );
}
