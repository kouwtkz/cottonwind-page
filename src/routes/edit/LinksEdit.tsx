import { useEffect, useMemo, useRef } from "react";
import { Modal } from "@/layout/Modal";
import { CreateState } from "@/state/CreateState";
import { ImagesUploadWithToast, useImageEditIsEditHold } from "./ImageEditForm";
import { useApiOrigin } from "@/state/EnvState";
import {
  BannerInner,
  myBannerName,
  useFavoriteLinksEditMode,
  useLinksEditMode,
} from "../LinksPage";
import { fileDialog } from "@/components/FileTool";
import { favLinksDataObject, imageDataObject } from "@/state/DataState";
import axios from "axios";
import { concatOriginUrl } from "@/functions/originUrl";
import { useFavLinks } from "@/state/LinksState";
import { FieldValues, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useHotkeys } from "react-hotkeys-hook";
import {
  AddButton,
  CancelButton,
  CompleteButton,
  ModeSwitch,
  MoveButton,
} from "@/layout/edit/CommonSwitch";
import { AiFillEdit } from "react-icons/ai";
import { StorageDataStateClass } from "@/functions/storage/StorageDataStateClass";
import { MdDeleteForever } from "react-icons/md";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  title: z.string().min(1, { message: "サイト名を入力してください" }),
});

export function LinksEdit({
  links,
  dataObject,
  send,
  edit,
  setEdit,
  album,
}: {
  links?: SiteLink[];
  dataObject: StorageDataStateClass<SiteLinkData>;
  send: string;
  edit?: number | boolean;
  setEdit(v?: number | boolean): void;
  album: string;
}) {
  const linksData = dataObject.useData()[0];
  const dataItem = useMemo(
    () => linksData?.find((v) => v.id === edit),
    [linksData, edit]
  );
  const item = useMemo(() => links?.find((v) => v.id === edit), [links, edit]);
  const targetLastmod = useRef<string | null>(null);
  useEffect(() => {
    if (targetLastmod.current) {
      setEdit(linksData?.find((v) => v.lastmod === targetLastmod.current)?.id);
      targetLastmod.current = null;
    }
  }, [linksData]);
  const apiOrigin = useApiOrigin()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
  const setLoad = dataObject.useLoad()[1];
  const {
    register,
    handleSubmit,
    getValues,
    formState: { isDirty, dirtyFields, errors },
  } = useForm<FieldValues>({
    defaultValues: {
      title: dataItem?.title,
      description: dataItem?.description,
      url: dataItem?.url,
    },
    resolver: zodResolver(schema),
  });
  useEffect(() => {
    Object.values(errors).forEach((error) => {
      toast.error(String(error?.message));
    });
  }, [errors]);
  useHotkeys(
    "ctrl+enter",
    (e) => {
      if (isDirty) handleSubmit(Submit)();
    },
    { enableOnFormTags: true }
  );
  function Submit() {
    const values = getValues();
    const entry = Object.fromEntries(
      Object.entries(dirtyFields)
        .filter((v) => v[1])
        .map((v) => [v[0], values[v[0]]])
    ) as SiteLink;
    entry.id = dataItem?.id;
    toast.promise(
      axios
        .post(concatOriginUrl(apiOrigin, send), entry, {
          withCredentials: true,
        })
        .then(() => {
          setLoad("no-cache");
          setEdit(false);
        }),
      {
        pending: "送信中",
        success: "送信しました",
        error: "送信に失敗しました",
      }
    );
  }
  return (
    <Modal
      onClose={() => {
        if (!isDirty || confirm("編集中ですが編集画面から離脱しますか？")) {
          setEdit(false);
        }
      }}
    >
      <form className="flex" onSubmit={handleSubmit(Submit)}>
        <button
          title="削除"
          type="button"
          className="color-warm absolute miniIcon"
          onClick={async () => {
            const id = item?.id;
            if (id && confirm("本当に削除しますか？")) {
              console.log(id);
              axios
                .delete(concatOriginUrl(apiOrigin, send), { data: { id } })
                .then(() => {
                  setLoad("no-cache");
                  setEdit(false);
                });
            }
          }}
        >
          <MdDeleteForever />
        </button>
        <div>
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
                    album,
                    albumOverwrite: false,
                    notDraft: true,
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
                    return axios
                      .post(
                        concatOriginUrl(apiOrigin, send),
                        {
                          id: dataItem?.id,
                          image: o.name,
                        } as SiteLinkData,
                        {
                          withCredentials: true,
                        }
                      )
                      .then((r) => {
                        if (r.status === 201) {
                          targetLastmod.current = r.data[0].entry.lastmod;
                        }
                        setLoad("no-cache");
                      });
                  }
                });
            }}
          >
            <BannerInner item={item} title="画像の設定" />
          </button>
        </div>
        <input title="サイト名" placeholder="サイト名" {...register("title")} />
        <textarea
          title="サイトの説明文"
          placeholder="サイトの説明文"
          {...register("description")}
        />
        <input
          title="サイトのURL"
          placeholder="サイトのURL"
          {...register("url")}
        />
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
  );
}

export const useEditLinkID = CreateState<number | boolean>();
export const useMoveLink = CreateState(0);
export function LinksEditButtons() {
  const setEdit = useEditLinkID()[1];
  const [move, setMove] = useMoveLink();
  return (
    <div className="icons">
      {move ? (
        <>
          <CancelButton
            onClick={() => {
              setMove(0);
            }}
          />
          <CompleteButton
            onClick={() => {
              setMove(2);
            }}
          />
        </>
      ) : (
        <>
          <ModeSwitch
            toEnableTitle="編集モードに切り替え"
            useSwitch={useLinksEditMode}
          >
            <AiFillEdit />
          </ModeSwitch>
          <AddButton
            onClick={() => {
              setEdit(true);
            }}
          />
          <MoveButton
            onClick={() => {
              setMove(1);
            }}
          />
        </>
      )}
    </div>
  );
}

export const useEditFavLinkID = CreateState<number | boolean>();
export const useMoveFavLink = CreateState(0);
export function FavBannerEditButtons() {
  const setEdit = useEditFavLinkID()[1];
  const [move, setMove] = useMoveFavLink();
  return (
    <div className="icons">
      {move ? (
        <>
          <CancelButton
            onClick={() => {
              setMove(0);
            }}
          />
          <CompleteButton
            onClick={() => {
              setMove(2);
            }}
          />
        </>
      ) : (
        <>
          <ModeSwitch
            toEnableTitle="編集モードに切り替え"
            useSwitch={useFavoriteLinksEditMode}
          >
            <AiFillEdit />
          </ModeSwitch>
          <AddButton
            onClick={() => {
              setEdit(true);
            }}
          />
          <MoveButton
            onClick={() => {
              setMove(1);
            }}
          />
        </>
      )}
    </div>
  );
}

export const useMoveMyBanner = CreateState(0);
export function MyBannerEditButtons() {
  const apiOrigin = useApiOrigin()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
  const [move, setMove] = useMoveMyBanner();
  return (
    <div className="icons">
      {move ? (
        <>
          <CancelButton
            onClick={() => {
              setMove(0);
            }}
          />
          <CompleteButton
            onClick={() => {
              setMove(2);
            }}
          />
        </>
      ) : (
        <>
          <ModeSwitch
            toEnableTitle="編集モードに切り替え"
            useSwitch={useImageEditIsEditHold}
          >
            <AiFillEdit />
          </ModeSwitch>
          <AddButton
            onClick={() => {
              fileDialog("image/*")
                .then((fileList) => fileList.item(0)!)
                .then((src) => {
                  return ImagesUploadWithToast({
                    src,
                    apiOrigin,
                    album: myBannerName,
                    albumOverwrite: false,
                    notDraft: true,
                  });
                })
                .then(async () => {
                  setImagesLoad("no-cache");
                });
            }}
          />
          <MoveButton
            onClick={() => {
              setMove(1);
            }}
          />
        </>
      )}
    </div>
  );
}
