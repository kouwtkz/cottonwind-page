import {
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal } from "~/components/layout/Modal";
import { CreateObjectState, CreateState } from "~/components/state/CreateState";
import {
  ImagesUploadWithToast,
  useImageEditSwitchHold,
  useNoUploadThumbnail,
  useUploadWebp,
} from "~/components/layout/edit/ImageEditForm";
import { BannerInner, myBannerName } from "../LinksPage";
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
import {
  useImageState,
  useSelectImageState,
} from "~/components/state/ImageState";
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
import { IMAGE_SEND_API } from "./ImagesManager";
import { ATProtocolEnv } from "~/Env";

type fileIndexedDBType = IndexedDataLastmodMH<
  FilesRecordType,
  FilesRecordDataType,
  MeeIndexedDBTable<FilesRecordType>
>;

export type editLinksType = number | boolean;
export type setEditLinksType = (v: [string, editLinksType]) => void;

export const useLinksEditMode = CreateState(false);
export const useLinksEdit = CreateObjectState<{
  src?: string;
  edit?: editLinksType;
  category?: string | null;
}>();

interface LinksEditProps {
  state: LinksStateType;
  indexedDB: LinksIndexedDBType;
  send: string;
  edit?: number | boolean;
  album: string;
  defaultCategories?: string[];
}
export function LinksEdit(args: LinksEditProps) {
  const { edit, src } = useLinksEdit();
  return (
    <>
      {edit && args.state.options.src === src ? (
        <LinksEditMain {...args} />
      ) : null}
    </>
  );
}
function LinksEditMain({
  state: linksState,
  indexedDB,
  send,
  album,
  defaultCategories,
}: LinksEditProps) {
  const { edit, category, Set } = useLinksEdit();
  const { links, linksMap } = linksState;
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
      key: item?.key || "",
      title: item?.title || "",
      description: item?.description || "",
      url: item?.url || "",
      category: item?.category || category || null,
      draft: item?.draft ?? null,
      prompt: item?.prompt || "",
      password: item?.password || "",
    },
    resolver: zodResolver(
      z.object({
        key: z
          .string()
          .min(1, { message: "リンクIDを入力してください" })
          .refine(
            (v) => v === item?.key || (linksMap ? !linksMap.has(v) : true),
            { message: "リンクIDが重複してます" }
          ),
      })
    ),
  });
  useEffect(() => {
    Object.values(errors).forEach((error) => {
      toast.error(String(error?.message));
    });
  }, [errors]);
  function CloseSetEdit() {
    Set({ edit: false, category: null });
  }
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
        CloseSetEdit();
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
      CloseSetEdit();
    }
  }
  useHotkeys("escape", Close, { enableOnFormTags: true });

  const { image: selectedImage, id: selectedImageID } = useSelectImageState();
  useEffect(() => {
    if (selectedImage && selectedImageID === "links") {
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
    }
  }, [selectedImage, selectedImageID,category]);

  return (
    <Modal onClose={Close}>
      <form className="flex" onSubmit={handleSubmit(Submit)}>
        <SetLinksImage
          image={item ? item.Image || item.image : null}
          album={album}
          link={item?.url}
          setImageLink={!Boolean(item?.password) && item?.category !== "secret"}
          onUploadedImage={(data) => {
            customFetch(concatOriginUrl(apiOrigin, send), {
              data: {
                id: item?.id,
                image: data.key,
                category: item?.category
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
          }}
        />
        <input title="リンクID" placeholder="リンクID" {...register("key")} />
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
                  {category || "default"}
                </option>
              ))}
            </select>
          ) : null}
          <label className="ml">
            <input {...register("draft")} type="checkbox" />
            <span>下書き</span>
          </label>
        </div>
        <details>
          <summary className="text-left">合言葉の設定</summary>
          <div className="flex column">
            <input
              title="ポップアップ文"
              placeholder="質問"
              autoComplete="off"
              className="mb-1"
              {...register("prompt")}
            />
            <input
              title="合言葉"
              placeholder="合言葉"
              autoComplete="off"
              {...register("password")}
            />
          </div>
        </details>
        <div className="actions">
          <button
            title="削除"
            type="button"
            className="color-warm"
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
                  Set({ edit: false });
                });
              }
            }}
          >
            削除
          </button>
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
export function SetLinksImage({
  album = "linkBanner",
  image,
  link,
  onUploadedImage,
  innerNoButton,
  setImageLink,
}: {
  album?: string;
  image?: ImageType | string | null;
  link?: string | null;
  onSelected?: Function;
  onUploadedImage?(data: ImageDataType): void;
  innerNoButton?: boolean;
  setImageLink?: boolean;
}) {
  const ID = "links";
  const { open, id, image: selectedImage } = useSelectImageState();
  useEffect(() => {
    if (selectedImage && ID === id && link) {
      if (
        setImageLink &&
        image &&
        typeof image === "object" &&
        selectedImage.link !== link
      ) {
        (async () =>
          image.link
            ? customFetch(concatOriginUrl(apiOrigin, IMAGE_SEND_API), {
                method: "PATCH",
                body: { id: image.id, link: null },
                cors: true,
              })
            : null)()
          .then(() => {
            return customFetch(concatOriginUrl(apiOrigin, IMAGE_SEND_API), {
              method: "PATCH",
              body: { id: selectedImage.id, link: link },
              cors: true,
            });
          })
          .then(() => {
            imageDataIndexed.load("no-cache");
          });
      }
    }
  }, [setImageLink, selectedImage, id, link, image]);
  return (
    <div className="setterImage">
      <button
        title="アルバムから画像を設定する"
        type="button"
        className="selectGallery translucent-button"
        onClick={() => {
          open({ id: "links", topAlbum: album });
        }}
      >
        <RiImageAddFill />
      </button>
      {innerNoButton ? (
        <BannerInner image={image} />
      ) : (
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
                  links: link,
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
                  if (onUploadedImage) onUploadedImage(o);
                }
              });
          }}
        >
          <BannerInner image={image} title="画像の設定" />
        </button>
      )}
    </div>
  );
}

export type editMoveLinkType = number;
export type setEditMoveLinkType = (v: editMoveLinkType) => void;
export type SendLinksDir = "" | "/fav";

interface LinksEditButtonsProps extends HTMLAttributes<HTMLDivElement> {
  album?: string;
  category?: string | null;
  dropdown?: ReactNode;
  indexedDB?: LinksIndexedDBType;
  move?: editMoveLinkType;
  setMove?: setEditMoveLinkType;
  state?: WithSet<LinksStateType>;
}
export function LinksEditButtons({
  album = "",
  category,
  dropdown,
  children,
  className,
  indexedDB,
  move,
  setMove,
  state,
  ...props
}: LinksEditButtonsProps) {
  const { Set } = useLinksEdit();
  className = useMemo(() => {
    const list = ["icons edit"];
    if (className) list.push(className);
    return list.join(" ");
  }, [className]);
  const ShowLinksGalleryButton = useCallback(
    ({ icon }: { icon?: boolean }) => (
      <Link
        className="button squared item flex items-center"
        title="画像の管理"
        to={{
          pathname: `/gallery/${album}`,
        }}
        state={{ backUrl: getBackURL() }}
      >
        {icon ? (
          <MdOutlineImage />
        ) : (
          <>
            <span>
              <MdOutlineImage />
            </span>
            <span>アルバムの表示</span>
          </>
        )}
      </Link>
    ),
    [album]
  );

  return (
    <div className={className} {...props}>
      {setMove && move ? (
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
          {indexedDB ? (
            <DropdownButton
              classNames={{
                dropMenuButton: "iconSwitch",
                dropItemList: "flex column font-small",
              }}
            >
              {state ? (
                <>
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
                      ImportLinksJson({ src: state.options.src }).then(() => {
                        indexedDB.load("no-cache-reload");
                      });
                    }}
                  >
                    JSONデータのインポート
                  </ObjectCommonButton>
                </>
              ) : null}
              <ShowLinksGalleryButton />
              {dropdown}
            </DropdownButton>
          ) : (
            <>
              <ShowLinksGalleryButton icon />
            </>
          )}
          <ModeSwitch
            toEnableTitle="編集モードに切り替え"
            useSwitch={useLinksEditMode}
          >
            <AiFillEdit />
          </ModeSwitch>
          {state ? (
            <AddButton
              onClick={() => {
                Set({ src: state.options.src, edit: true, category });
              }}
            />
          ) : null}
          {setMove ? (
            <MoveButton
              onClick={() => {
                setMove(1);
              }}
            />
          ) : null}
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
    <div className="icons edit">
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
