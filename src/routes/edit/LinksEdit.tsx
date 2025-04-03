import {
  HTMLAttributes,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal } from "@/layout/Modal";
import { CreateState } from "@/state/CreateState";
import {
  ImagesUploadWithToast,
  useImageEditSwitchHold,
  useNoUploadThumbnail,
  useUploadWebp,
} from "@/layout/edit/ImageEditForm";
import { useApiOrigin } from "@/state/EnvState";
import { BannerInner, myBannerName, useLinksEditMode } from "../LinksPage";
import { fileDialog } from "@/components/FileTool";
import { imageDataObject, ImportLinksJson } from "@/state/DataState";
import axios from "axios";
import { concatOriginUrl } from "@/functions/originUrl";
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
import { MdDeleteForever, MdOutlineImage } from "react-icons/md";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DropdownButton } from "@/components/dropdown/DropdownButton";
import {
  ObjectDownloadButton,
  ObjectCommonButton,
} from "@/components/button/ObjectDownloadButton";
import { TbDatabaseImport } from "react-icons/tb";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { RiImageAddFill } from "react-icons/ri";
import { useSelectedImage } from "@/state/ImageState";

const schema = z.object({
  title: z.string().min(1, { message: "サイト名を入力してください" }),
});

export type editLinksType = number | boolean | undefined;
export type setEditLinksType = (v: editLinksType) => void;

interface LinksEditProps {
  links?: SiteLink[];
  dataObject: StorageDataStateClass<SiteLinkData>;
  send: string;
  edit?: number | boolean;
  setEdit: setEditLinksType;
  album: string;
  category?: string | null;
  defaultCategories?: string[];
}
export function LinksEdit({
  links,
  dataObject,
  send,
  edit,
  setEdit,
  album,
  category,
  defaultCategories,
}: LinksEditProps) {
  let { state } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const linksData = dataObject.useData()[0];
  const dataItem = useMemo(
    () => linksData?.find((v) => v.id === edit),
    [linksData, edit]
  );
  const item = useMemo(() => links?.find((v) => v.id === edit), [links, edit]);
  const categories = useMemo(() => {
    const list = [""];
    if (category && list.every((v) => v !== category)) list.push(category);
    defaultCategories?.forEach((dc) => {
      if (list.every((v) => v !== dc)) list.push(dc);
    });
    return list;
  }, [links, category, defaultCategories]);
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
      category: dataItem?.category ?? category,
    },
    resolver: zodResolver(schema),
  });
  useEffect(() => {
    Object.values(errors).forEach((error) => {
      toast.error(String(error?.message));
    });
  }, [errors]);
  function Submit() {
    const values = getValues();
    const entry = Object.fromEntries(
      Object.entries(dirtyFields)
        .filter((v) => v[1])
        .map((v) => [v[0], values[v[0]]])
    ) as SiteLink;
    entry.id = dataItem?.id;
    if (typeof dataItem?.category === "undefined") {
      entry.category = category;
    }
    if (typeof entry.category !== "undefined" && !entry.category) {
      entry.category = null;
    }
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
  useHotkeys(
    "ctrl+enter",
    (e) => {
      if (isDirty) handleSubmit(Submit)();
    },
    { enableOnFormTags: true }
  );
  function Close() {
    if (!isDirty || confirm("編集中ですが編集画面から離脱しますか？")) {
      setEdit(false);
    }
  }
  useHotkeys("escape", Close, { enableOnFormTags: true });

  const [isSelectedImage, setIsSelectedImage] = useState<boolean>();
  const selectedImage = useSelectedImage()[0];
  useEffect(() => {
    if (selectedImage && isSelectedImage) {
      axios
        .post(
          concatOriginUrl(apiOrigin, send),
          {
            id: dataItem?.id,
            image: selectedImage.key,
            category,
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
      setIsSelectedImage(false);
    }
  }, [selectedImage, isSelectedImage]);

  return (
    <Modal onClose={Close}>
      <form className="flex" onSubmit={handleSubmit(Submit)}>
        <button
          title="削除"
          type="button"
          className="color-warm absolute miniIcon"
          onClick={async () => {
            const id = item?.id;
            if (id && confirm("本当に削除しますか？")) {
              axios
                .delete(concatOriginUrl(apiOrigin, send), { data: { id } })
                .then(() => {
                  toast.success("削除しました");
                  setLoad("no-cache");
                  setEdit(false);
                });
            }
          }}
        >
          <MdDeleteForever />
        </button>
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
              newSearchParams.set("topAlbum", album);
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
                    album,
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
                          id: dataItem?.id,
                          image: o.key,
                          category,
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
        {categories.length ? (
          <select title="カテゴリ" {...register("category")}>
            {categories.map((category) => (
              <option value={category} key={category}>
                {category || "未分類"}
              </option>
            ))}
          </select>
        ) : null}
        <div className="actions">
          <button
            type="button"
            className="color"
            onClick={handleSubmit(Submit)}
            disabled={!isDirty}
          >
            送信
          </button>
        </div>
      </form>
    </Modal>
  );
}

export type editMoveLinkType = number;
export type setEditMoveLinkType = (v: editMoveLinkType) => void;
export type SendLinksDir = "" | "/fav";

interface LinksEditButtonsProps extends HTMLAttributes<HTMLDivElement> {
  setEdit: setEditLinksType;
  album: string;
  dropdown?: ReactNode;
  dataObject: StorageDataStateClass<SiteLinkData>;
  move: editMoveLinkType;
  setMove: setEditMoveLinkType;
  dir?: SendLinksDir;
}
export function LinksEditButtons({
  setEdit,
  album,
  dropdown,
  children,
  className,
  dataObject,
  move,
  setMove,
  dir,
  ...props
}: LinksEditButtonsProps) {
  const apiOrigin = useApiOrigin()[0];
  const setLinksLoad = dataObject.useLoad()[1];
  const ImageManageButtonSearch = useMemo(
    () =>
      new URLSearchParams({
        q: "album:" + album,
      }).toString(),
    [album]
  );
  className = useMemo(() => {
    const list = ["icons flex center mb-1"];
    if (className) list.push(className);
    return list.join(" ");
  }, [className]);
  return (
    <div className={className} {...props}>
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
          <DropdownButton
            classNames={{
              dropMenuButton: "iconSwitch",
              dropItemList: "flex column font-small",
            }}
          >
            <ObjectDownloadButton
              className="squared item"
              dataObject={dataObject}
            >
              JSONデータのダウンロード
            </ObjectDownloadButton>
            <ObjectCommonButton
              icon={<TbDatabaseImport />}
              className="squared item"
              onClick={() => {
                ImportLinksJson({ apiOrigin, dir }).then(() => {
                  setLinksLoad("no-cache-reload");
                });
              }}
            >
              JSONデータのインポート
            </ObjectCommonButton>
            <Link
              className="button squared item flex items-center"
              title="画像の管理"
              to={{
                pathname: "/admin/images",
                search: ImageManageButtonSearch,
              }}
              state={{ backUrl: location.href }}
            >
              <span>
                <MdOutlineImage />
              </span>
              <span>アルバムの表示</span>
            </Link>
            {dropdown}
          </DropdownButton>
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
          {children}
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
  const webp = useUploadWebp()[0];
  const thumbnail = !useNoUploadThumbnail()[0];
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
            useSwitch={useImageEditSwitchHold}
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
                    webp,
                    thumbnail,
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
