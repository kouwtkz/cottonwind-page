import {
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal } from "~/components/layout/Modal";
import { CreateState } from "~/components/state/CreateState";
import {
  ImagesUploadWithToast,
  useImageEditSwitchHold,
  useNoUploadThumbnail,
  useUploadWebp,
} from "~/components/layout/edit/ImageEditForm";
import { BannerInner, myBannerName, useLinksEditMode } from "../LinksPage";
import { fileDialog } from "~/components/utils/FileTool";
import { apiOrigin, imageDataIndexed } from "~/data/ClientDBLoader";
import { ImportLinksJson } from "~/data/ClientDBFunctions";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { type FieldValues, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useHotkeys } from "react-hotkeys-hook";
import {
  AddButton,
  CancelButton,
  CompleteButton,
  ModeSwitch,
  MoveButton,
} from "~/components/layout/edit/CommonSwitch";
import { AiFillEdit } from "react-icons/ai";
import { MdDeleteForever, MdOutlineImage } from "react-icons/md";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DropdownButton } from "~/components/dropdown/DropdownButton";
import {
  ObjectCommonButton,
  ObjectIndexedDBDownloadButton,
} from "~/components/button/ObjectDownloadButton";
import { TbDatabaseImport } from "react-icons/tb";
import { Link, useLocation, useSearchParams } from "react-router";
import { RiImageAddFill } from "react-icons/ri";
import { useSelectedImage } from "~/components/state/ImageState";
import { MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";
import { IndexedDataLastmodMH } from "~/data/IndexedDB/IndexedDataLastmodMH";
import {
  type LinksIndexedDBType,
  type LinksStateType,
  useLinks,
} from "~/components/state/LinksState";
import { findMee } from "~/data/find/findMee";
import { customFetch } from "~/components/functions/fetch";
import { getBackURL } from "~/components/layout/BackButton";

type fileIndexedDBType = IndexedDataLastmodMH<
  FilesRecordType,
  FilesRecordDataType,
  MeeIndexedDBTable<FilesRecordType>
>;

const schema = z.object({
  title: z.string().min(1, { message: "サイト名を入力してください" }),
});

export type editLinksType = number | boolean | undefined;
export type setEditLinksType = (v: editLinksType) => void;

interface LinksEditProps {
  state: LinksStateType;
  indexedDB: LinksIndexedDBType;
  send: string;
  edit?: number | boolean;
  setEdit: setEditLinksType;
  album: string;
  category?: string | null;
  defaultCategories?: string[];
}
export function LinksEdit({
  state: linksState,
  indexedDB,
  send,
  edit,
  setEdit,
  album,
  category,
  defaultCategories,
}: LinksEditProps) {
  const { links } = linksState;
  let { state } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetLastmod = useRef<string | null>(null);
  const item = useMemo(() => {
    let item: SiteLink | undefined;
    if (links && typeof edit === "number") {
      item = findMee(links, { where: { id: edit } })[0];
    }
    if (item?.rawdata?.lastmod) targetLastmod.current = item.rawdata.lastmod;
    return item;
  }, [edit, links]);
  const categories = useMemo(() => {
    const list = [""];
    if (category && list.every((v) => v !== category)) list.push(category);
    defaultCategories?.forEach((dc) => {
      if (list.every((v) => v !== dc)) list.push(dc);
    });
    return list;
  }, [links, category, defaultCategories]);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { isDirty, dirtyFields, errors },
  } = useForm<any>({
    defaultValues: {
      title: item?.title,
      description: item?.description,
      url: item?.url,
      category: item?.category ?? category,
      draft: item?.draft ?? null,
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
    entry.id = item?.id;
    if (typeof item?.category === "undefined") {
      entry.category = category;
    }
    if (typeof entry.category !== "undefined" && !entry.category) {
      entry.category = null;
    }
    toast.promise(
      customFetch(concatOriginUrl(apiOrigin, send), {
        data: entry,
        method: "POST",
        cors: true,
      }).then(() => {
        indexedDB.load("no-cache");
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
      customFetch(concatOriginUrl(apiOrigin, send), {
        data: {
          id: item?.id,
          image: selectedImage.key,
          category,
        } as SiteLinkData,
        method: "POST",
        cors: true,
      })
        .then(async (r) => ({ ...r, data: (await r.json()) as any }))
        .then((r) => {
          if (r.status === 201) {
            targetLastmod.current = r.data[0].entry.lastmod;
          }
          indexedDB.load("no-cache");
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
              customFetch(concatOriginUrl(apiOrigin, send), {
                method: "DELETE",
                body: { id },
                cors: true,
              }).then(() => {
                toast.success("削除しました");
                indexedDB.load("no-cache");
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
                  imageDataIndexed.load("no-cache");
                  return (r?.[0].data || null) as ImageDataType | null;
                })
                .then(async (o) => {
                  if (o && typeof o.key === "string") {
                    return customFetch(concatOriginUrl(apiOrigin, send), {
                      data: {
                        id: item?.id,
                        image: o.key,
                        category,
                      } as SiteLinkData,
                      method: "POST",
                      cors: true,
                    })
                      .then(async (r) => ({
                        ...r,
                        data: (await r.json()) as any,
                      }))
                      .then((r) => {
                        if (r.status === 201) {
                          targetLastmod.current = r.data[0].entry.lastmod;
                        }
                        indexedDB.load("no-cache");
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
        <div className="flex center">
          {categories.length ? (
            <select
              title="カテゴリ"
              {...register("category")}
              className="flex-1"
            >
              {categories.map((category) => (
                <option value={category} key={category}>
                  {category || "未分類"}
                </option>
              ))}
            </select>
          ) : null}
          <label className="ml">
            <input {...register("draft")} type="checkbox" />
            <span>下書き</span>
          </label>
        </div>
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
  state: LinksStateType;
  indexedDB: LinksIndexedDBType;
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
  state,
  indexedDB,
  move,
  setMove,
  dir,
  ...props
}: LinksEditButtonsProps) {
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
            <ObjectIndexedDBDownloadButton
              className="squared item"
              indexedDB={indexedDB}
            >
              JSONデータのダウンロード
            </ObjectIndexedDBDownloadButton>
            <ObjectCommonButton
              icon={<TbDatabaseImport />}
              className="squared item"
              onClick={() => {
                ImportLinksJson({ dir }).then(() => {
                  indexedDB.load("no-cache-reload");
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
              state={{ backUrl: getBackURL() }}
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
                  imageDataIndexed.load("no-cache");
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
