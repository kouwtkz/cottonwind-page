import axios from "axios";
import {
  HTMLAttributes,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import { Link, useSearchParams } from "react-router-dom";
import { useDataIsComplete } from "@/state/StateSet";
import { MakeRelativeURL } from "@/functions/doc/MakeURL";
import {
  LinksMapType,
  useFavLinks,
  useFavLinksMap,
  useLinksMap,
} from "@/state/LinksState";
import {
  useApiOrigin,
  useEnv,
  useIsLogin,
  useMediaOrigin,
} from "@/state/EnvState";
import { ImageMee } from "@/layout/ImageMee";
import { CreateState } from "@/state/CreateState";
import {
  LinksEdit,
  MyBannerEditButtons,
  useMoveMyBanner,
  LinksEditButtons,
  editLinksType,
} from "./edit/LinksEdit";
import { useImageEditIsEditHold } from "./edit/ImageEditForm";
import { useImageState } from "@/state/ImageState";
import { concatOriginUrl } from "@/functions/originUrl";
import { useImageViewer } from "@/layout/ImageViewer";
import { Movable } from "@/layout/edit/Movable";
import {
  favLinksDataObject,
  imageDataObject,
  linksDataObject,
} from "@/state/DataState";
import { CompatGalleryButton } from "./edit/ImagesManager";
import { StorageDataStateClass } from "@/functions/storage/StorageDataStateClass";

export default function LinksPage() {
  const env = useEnv()[0];
  const topLinkTitle = useMemo(() => {
    let title: string | undefined;
    if (env?.AUTHOR_NAME) title = env.AUTHOR_NAME + "のリンクたち";
    return title;
  }, [env]);
  return (
    <div className="linkPage">
      <h2 className="color-main en-title-font">LINKS</h2>
      <MeeLinks title="トップリンク" category="top" banner />
      <MeeLinks title={topLinkTitle} category="" />
      <MeeLinks title="コミッション" category="commission" />
      <div>
        <h3 className="leaf">いろいろ</h3>
        <ul className="flex center column large">
          <li>
            <InviteDiscordLink />
          </li>
          <li>
            <a href="/suggest">Suggest page (links for miss typo)</a>
          </li>
          <li>
            <Link to="/log" state={{ backUrl: location.href }}>
              サイトの更新履歴 (Git)
            </Link>
          </li>
        </ul>
      </div>
      <MyBanners />
      <FavoriteLinks />
      <FavoriteLinks title="参加してるイベント" category="event" />
      <FavoriteLinks title="登録サーチ" category="search" />
    </div>
  );
}

function InviteDiscordLink({
  children = "Discordのコミュニティサーバー",
}: {
  children?: React.ReactNode;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const invite = searchParams.get("invite");
  const [isComplete] = useDataIsComplete();
  const question = useMemo(async () => {
    return axios.get("/fetch/discord/invite").then((r) => r.data);
  }, []);
  useEffect(() => {
    if (isComplete && invite === "discord") {
      anchorRef.current!.click();
      searchParams.delete("invite");
      setSearchParams(searchParams, {
        replace: true,
        preventScrollReset: true,
      });
    }
  }, [isComplete, invite]);
  return (
    <a
      title="Discordの招待リンク（合言葉入力式）"
      href="?invite=discord"
      target="discord"
      ref={anchorRef}
      onClick={async (e) => {
        const element = anchorRef.current!;
        if (!element.hasAttribute("invited")) {
          e.preventDefault();
          const answer = prompt(await question);
          if (answer) {
            axios
              .get(
                MakeRelativeURL({
                  pathname: "/fetch/discord/invite",
                  query: { invite_password: answer },
                })
              )
              .then((r) => {
                element.title = "Discordの招待リンク";
                element.href = r.data;
                element.setAttribute("invited", "");
                element.click();
              })
              .catch((e) => {
                toast.error(`認証に失敗しました [${e}]`);
              });
          }
        }
      }}
    >
      {children}
    </a>
  );
}

export const useBannersEditMode = CreateState(false);
export const myBannerName = "myBanner";
export function MyBanners() {
  const [move, setMove] = useMoveMyBanner();
  const isLogin = useIsLogin()[0];
  const { imageAlbums } = useImageState();
  const album = imageAlbums?.get(myBannerName);
  const { setImages } = useImageViewer();
  const apiOrigin = useApiOrigin()[0];
  const setImageDataLoad = imageDataObject.useLoad()[1];
  const myBanners = useMemo(() => {
    const list = album?.list.concat() || [];
    list.sort((a, b) => (a.order || 0xffff) - (b.order || 0xffff));
    return list;
  }, [album?.list]);
  useEffect(() => {
    setImages(album?.list || null);
  }, [setImages, album]);
  const className = useMemo(() => {
    const classes = ["bannerArea"];
    return classes.join(" ");
  }, []);
  return (
    <div>
      <h3 className="leaf">サイトのバナー</h3>
      {isLogin ? <MyBannerEditButtons /> : null}
      <ul className={className}>
        {move ? (
          <Movable
            items={myBanners}
            Inner={MyBannerInner}
            submit={move === 2}
            onSubmit={(items) => {
              const dirty = items
                .map((item, i) => ({
                  ...item,
                  newOrder: i + 1,
                }))
                .filter((item, i) => item.newOrder !== item.order)
                .map(({ id, newOrder }) => {
                  return { id, order: newOrder };
                });
              if (dirty.length > 0) {
                toast.promise(
                  axios
                    .patch(concatOriginUrl(apiOrigin, "image/send"), dirty, {
                      withCredentials: true,
                    })
                    .then(() => {
                      setImageDataLoad("no-cache");
                      setMove(0);
                    }),
                  {
                    pending: "送信中",
                    success: "送信しました",
                    error: "送信に失敗しました",
                  }
                );
              } else setMove(0);
            }}
          />
        ) : (
          <>
            {myBanners.map((image, i) => (
              <li key={i}>
                <MyBannerInner item={image} />
              </li>
            ))}
          </>
        )}
      </ul>
    </div>
  );
}

function MyBannerInner({ item, move }: { item: ImageType; move?: boolean }) {
  const mediaOrigin = useMediaOrigin()[0];
  const setSearchParams = useSearchParams()[1];
  const edit = useImageEditIsEditHold()[0];
  return (
    <div>
      <div>
        {item.width}×{item.height} px
      </div>
      <a
        title={item.title || item.src || ""}
        {...(move ? {} : { href: concatOriginUrl(mediaOrigin, item.src) })}
        target="banner"
        className="overlay"
        onClick={(e) => {
          if (edit) {
            setSearchParams({ image: item.key }, { preventScrollReset: true });
            e.preventDefault();
          }
        }}
      >
        <ImageMee
          alt={`${item.width}×${item.height}バナー`}
          className="banner"
          imageItem={item}
          autoPixel={false}
        />
      </a>
    </div>
  );
}

export const useLinksEditMode = CreateState(false);
interface LinksContainerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  category?: string;
  banner?: boolean;
  send: string;
  dropdown?: ReactNode;
  map?: LinksMapType;
  dataObject: StorageDataStateClass<SiteLinkData>;
  defaultCategories?: string[];
}
function LinksContainer({
  category,
  title,
  className,
  banner,
  send,
  map,
  dataObject,
  dropdown,
  defaultCategories,
  ...props
}: LinksContainerProps) {
  const album = useMemo(() => (banner ? "linkBanner" : "linksImage"), [banner]);
  const links = useMemo(() => {
    return map?.get(category || "") || [];
  }, [map, category]);
  const [edit, setEdit] = useState<editLinksType>();
  const [move, setMove] = useState(0);
  const isLogin = useIsLogin()[0];
  const apiOrigin = useApiOrigin()[0];
  const isEditable = useLinksEditMode()[0];
  const setLoad = linksDataObject.useLoad()[1];
  const ulClassName = useMemo(() => {
    const list = ["linksArea"];
    if (banner) list.push("bannerArea");
    else list.push("large");
    return list.join(" ");
  }, [links, banner]);
  className = useMemo(() => {
    const list = [];
    if (className) list.push(className);
    return list.join(" ");
  }, [className]);
  const LinkInner = useCallback(
    ({ item }: { item: SiteLink }) => {
      return banner ? (
        <BannerItem item={item} isEdit={isEditable} setEditLink={setEdit} />
      ) : (
        <a
          href={item.url || ""}
          className="overlay"
          target="_blank"
          onClick={(e) => {
            if (isEditable) {
              setEdit(item.id);
              e.preventDefault();
            }
          }}
        >
          {item.title}
        </a>
      );
    },
    [isEditable, banner]
  );
  const visible = useMemo(() => isLogin || links.length > 0, [isLogin, links]);
  return (
    <>
      {visible ? (
        <div className={className} {...props}>
          {edit ? (
            <LinksEdit
              send={send}
              links={links}
              dataObject={dataObject}
              edit={edit}
              setEdit={setEdit}
              album={album}
              category={category}
              defaultCategories={defaultCategories}
            />
          ) : null}
          {title ? <h3 className="leaf">{title || "リンク集"}</h3> : null}
          {isLogin ? (
            <LinksEditButtons
              setEdit={setEdit}
              album={album}
              dataObject={dataObject}
              move={move}
              setMove={setMove}
              dropdown={dropdown}
            />
          ) : null}
          <ul className={ulClassName}>
            {move ? (
              <Movable
                items={links}
                Inner={LinkInner}
                submit={move === 2}
                onSubmit={(items) => {
                  const dirty = items
                    .map((item, i) => ({
                      ...item,
                      newOrder: i + 1,
                    }))
                    .filter((item, i) => item.newOrder !== item.order)
                    .map(({ id, newOrder }) => {
                      return { id, order: newOrder };
                    });
                  if (dirty.length > 0) {
                    toast.promise(
                      axios
                        .post(concatOriginUrl(apiOrigin, send), dirty, {
                          withCredentials: true,
                        })
                        .then(() => {
                          setLoad("no-cache");
                          setMove(0);
                        }),
                      {
                        pending: "送信中",
                        success: "送信しました",
                        error: "送信に失敗しました",
                      }
                    );
                  } else setMove(0);
                }}
              />
            ) : (
              <>
                {links?.map((v, i) => (
                  <li key={i}>
                    <LinkInner item={v} />
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      ) : null}
    </>
  );
}

interface MeeLinksProps
  extends Omit<LinksContainerProps, "send" | "dataObject"> {}
export function MeeLinks(props: MeeLinksProps) {
  return (
    <LinksContainer
      send="links/send"
      map={useLinksMap()[0]}
      dataObject={linksDataObject}
      defaultCategories={["commission"]}
      {...props}
    />
  );
}
interface FavoriteLinksProps
  extends Omit<LinksContainerProps, "send" | "dataObject"> {}
export function FavoriteLinks(props: FavoriteLinksProps) {
  return (
    <LinksContainer
      title="お気に入りのサイト"
      send="links/fav/send"
      map={useFavLinksMap()[0]}
      dataObject={favLinksDataObject}
      dropdown={
        <CompatGalleryButton
          className="item"
          from="favBanner"
          to="linkBanner"
        />
      }
      banner
      defaultCategories={["event", "search"]}
      {...props}
    />
  );
}

export function getTitleWithDsc(item: SiteLink) {
  return item.title + (item.description ? " - " + item.description : "");
}

export function BannerInner({
  item,
  title,
  alt,
}: {
  item?: SiteLink | null;
  title?: string;
  alt?: string;
}) {
  return (
    <>
      {item?.Image ? (
        <ImageMee
          className="banner"
          imageItem={item.Image}
          alt={alt || getTitleWithDsc(item)}
          autoPixel={false}
        />
      ) : item?.image ? (
        <img
          className="banner"
          src={item.image}
          width={200}
          height={40}
          alt={item.image}
        />
      ) : (
        <div className="banner">
          <span
            style={{
              width: 200,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {title || item?.title}
          </span>
        </div>
      )}
    </>
  );
}

export function BannerItem({
  item,
  isEdit,
  setEditLink,
}: {
  item: SiteLink;
  isEdit?: boolean;
  setEditLink: (v?: number | boolean) => void;
}) {
  const titleWithDsc = getTitleWithDsc(item);
  return (
    <a
      href={item.url || ""}
      title={titleWithDsc}
      target="_blank"
      className="overlay"
      onClick={(e) => {
        if (isEdit) {
          setEditLink(item.id);
          e.preventDefault();
        }
      }}
    >
      <BannerInner item={item} alt={titleWithDsc} />
    </a>
  );
}
