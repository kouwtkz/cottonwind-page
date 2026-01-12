import React, {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import { Link, useSearchParams } from "react-router";
import { MakeRelativeURL } from "~/components/functions/doc/MakeURL";
import {
  useLinks,
  type LinksStateType,
  useFavLinks,
  type LinksIndexedDBType,
} from "~/components/state/LinksState";
import { useIsLogin } from "~/components/state/EnvState";
import { ImageMee } from "~/components/layout/ImageMee";
import { CreateState } from "~/components/state/CreateState";
import {
  LinksEdit,
  MyBannerEditButtons,
  useMoveMyBanner,
  LinksEditButtons,
  type editLinksType,
  type SendLinksDir,
  SetLinksImage,
} from "./edit/LinksEdit";
import { useImageEditSwitchHold } from "~/components/layout/edit/ImageEditForm";
import { useImageState } from "~/components/state/ImageState";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { useImageViewer } from "~/components/layout/ImageViewer";
import { Movable } from "~/components/layout/edit/Movable";
import {
  imageDataIndexed,
  linksDataIndexed,
  favLinksDataIndexed,
  apiOrigin,
  mediaOrigin,
} from "~/data/ClientDBLoader";
import { CompatGalleryButton, IMAGE_SEND_API } from "./edit/ImagesManager";
import { findMee } from "~/data/find/findMee";
import { customFetch } from "~/components/functions/fetch";
import {
  GetAPIFromOptions,
  ImageDataOptions,
  linksDataOptions,
} from "~/data/DataEnv";
import { ATProtocolEnv, EnvLinksMap } from "~/Env";
import { useATProtoState } from "~/components/state/ATProtocolState";
import { Modal } from "~/components/layout/Modal";

const LINKS_API = GetAPIFromOptions(linksDataOptions);
const LINKS_VERIFY_API = GetAPIFromOptions(linksDataOptions, "/verify");

export const ArchiveLinks: Array<SiteLink> = [];
if (ATProtocolEnv.getBlog)
  ArchiveLinks.push({ title: "サイト内ブログ", url: "/blog" });

export default function LinksPage() {
  const githubLink = useMemo(() => EnvLinksMap.get("github"), [EnvLinksMap]);
  return (
    <div className="linkPage">
      <h2 className="color-main en-title-font">LINKS</h2>
      {ATProtocolEnv.setLinkat ? (
        <>
          <Linkat />
          <MeeLinks title="Top Link" category="top" banner fold />
          <MeeLinks title="Commission" category="commission" banner fold open />
          <MeeLinks title="Archive" category={null} banner fold />
        </>
      ) : (
        <>
          <MeeLinks title="Top Link" category="top" banner fold open />
          <MeeLinks title="Commission" category="commission" banner fold open />
          <MeeLinks title="My Link" category={null} banner fold open />
        </>
      )}
      <div>
        <h3 className="color-main en-title-font">Others</h3>
        <ul className="flex center column font-larger">
          <li>
            <Link to="/suggest">Suggest page (links for miss typo)</Link>
          </li>
          {githubLink ? (
            <li>
              <a
                href={githubLink.url}
                title={githubLink.title || githubLink.name}
                target="_blank"
              >
                サイトの更新詳細 (GitHub)
              </a>
            </li>
          ) : null}
        </ul>
      </div>
      <MyBanners />
      <FavoriteLinks />
      <FavoriteLinks title="Joining Event" category="event" />
      <FavoriteLinks title="Joined Search" category="search" />
    </div>
  );
}

export const useBannersEditMode = CreateState(false);
export const myBannerName = "myBanner";
export function MyBanners() {
  const [move, setMove] = useMoveMyBanner();
  const isLogin = useIsLogin()[0];
  const { imageAlbums } = useImageState();
  const album = imageAlbums?.get(myBannerName);
  const { Set: setImageViewer } = useImageViewer();
  const myBanners = useMemo(() => {
    const list = album?.list.concat() || [];
    list.sort((a, b) => (a.order || 0xffff) - (b.order || 0xffff));
    return list;
  }, [album?.list]);
  useEffect(() => {
    setImageViewer({ images: album?.list || null });
  }, [album]);
  const className = useMemo(() => {
    const classes = ["bannerArea"];
    return classes.join(" ");
  }, []);
  return (
    <div>
      <h3 className="color-main en-title-font">Site Banner</h3>
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
                  customFetch(concatOriginUrl(apiOrigin, IMAGE_SEND_API), {
                    method: "PATCH",
                    data: dirty,
                    cors: true,
                  }).then(() => {
                    imageDataIndexed.load("no-cache");
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
  const setSearchParams = useSearchParams()[1];
  const edit = useImageEditSwitchHold()[0];
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
  category?: string | null;
  banner?: boolean;
  dir?: SendLinksDir;
  dropdown?: ReactNode;
  state: WithSet<LinksStateType>;
  indexedDB?: LinksIndexedDBType;
  defaultCategories?: string[];
  linkStyle?: CSSProperties;
  fold?: boolean;
  open?: boolean;
  editable?: boolean;
}
function LinksContainer({
  category = null,
  title,
  className,
  banner,
  dir = "",
  state,
  indexedDB,
  dropdown,
  defaultCategories,
  linkStyle,
  fold,
  open,
  editable = true,
  ...props
}: LinksContainerProps) {
  const send = LINKS_API + dir + "/send";
  const album = useMemo(() => (banner ? "linkBanner" : "linksImage"), [banner]);
  const [edit, setEdit] = useState<editLinksType>();
  const [move, setMove] = useState(0);
  const links = useMemo(() => {
    const links = state.links
      ? findMee(state.links, {
          where: { category },
          orderBy: [{ id: "asc", order: "asc" }],
        })
      : [];
    if (!category && !move) return links.concat(ArchiveLinks);
    else return links;
  }, [category, state.links, move]);
  const isLogin = useIsLogin()[0];
  const isEditable = useLinksEditMode()[0];
  const ulClassName = useMemo(() => {
    const list = ["linksArea"];
    if (banner) list.push("bannerArea");
    else list.push("font-larger");
    return list.join(" ");
  }, [links, banner]);
  className = useMemo(() => {
    const list = [];
    if (className) list.push(className);
    return list.join(" ");
  }, [className]);
  const LinkInner = useCallback(
    ({ item }: { item: SiteLink }) => {
      const titleWithDsc = getTitleWithDsc(item);
      const prop = {
        title: titleWithDsc,
        className: "overlay",
        style: linkStyle,
        onClick(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
          if (isEditable) {
            setEdit(item.id);
            e.preventDefault();
          } else if (!item.url) {
            e.preventDefault();
            if (item.prompt) {
              const answer = prompt(item.prompt);
              if (answer)
                customFetch(concatOriginUrl(apiOrigin, LINKS_VERIFY_API), {
                  method: "POST",
                  body: { id: item.id, password: answer },
                  cors: true,
                })
                  .then((r) => {
                    if (r.status === 200) {
                      return r.text();
                    } else {
                      throw r;
                    }
                  })
                  .then((url) => {
                    toast.success("認証に成功しました", { autoClose: 1500 });
                    item.url = url;
                    state.Set(({ links, linksMap }) => ({
                      links: links?.concat(),
                      linksMap: new Map(linksMap),
                    }));
                  })
                  .catch((e) => {
                    const r = e as Response;
                    toast.error(`認証に失敗しました [${r.status}]`);
                  });
            }
          } else if (item.prompt && !item.password) {
            if (!confirm(item.prompt)) {
              e.preventDefault();
            }
          }
        },
      };
      <a
        href={item.url || ""}
        title={titleWithDsc}
        target="_blank"
        className="overlay"
        onClick={(e) => {
          if (isEditable) {
            setEdit(item.id);
            e.preventDefault();
          }
        }}
      >
        <BannerInner image={item.Image || item.image} alt={titleWithDsc} />
      </a>;
      function Inner() {
        return (
          <>
            {banner ? (
              <BannerInner
                image={item.Image || item.image}
                title={item.title || titleWithDsc}
                alt={titleWithDsc}
              />
            ) : (
              item.title
            )}
          </>
        );
      }

      return item.url?.startsWith("/") ? (
        <Link to={item.url} {...prop}>
          <Inner />
        </Link>
      ) : (
        <a href={item.url || ""} target="_blank" {...prop}>
          <Inner />
        </a>
      );
    },
    [isEditable, banner, linkStyle, state]
  );
  const visible = useMemo(() => isLogin || links.length > 0, [isLogin, links]);
  const inner = (
    <>
      {editable && isLogin ? (
        <LinksEditButtons
          indexedDB={indexedDB}
          setEdit={setEdit}
          album={album}
          move={move}
          setMove={setMove}
          dropdown={dropdown}
          dir={dir}
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
                  customFetch(concatOriginUrl(apiOrigin, send), {
                    data: dirty,
                    method: "POST",
                    cors: true,
                  }).then(() => {
                    indexedDB?.load("no-cache");
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
    </>
  );
  return (
    <>
      {visible ? (
        <div className={className} {...props}>
          {edit && indexedDB ? (
            <LinksEdit
              state={state}
              indexedDB={indexedDB}
              send={send}
              edit={edit}
              setEdit={setEdit}
              album={album}
              category={category}
              defaultCategories={defaultCategories}
            />
          ) : null}
          {fold ? (
            <details open={open}>
              <summary className="h3 color-main en-title-font">
                {title || "Links"}
              </summary>
              {inner}
            </details>
          ) : (
            <>
              {title ? (
                <h3 className="color-main en-title-font">{title || "Links"}</h3>
              ) : null}
              {inner}
            </>
          )}
        </div>
      ) : null}
    </>
  );
}

interface MeeLinksProps
  extends Omit<
    LinksContainerProps,
    "send" | "dataObject" | "state" | "indexedDB"
  > {}
export function MeeLinks(props: MeeLinksProps) {
  const state = useLinks();
  return (
    <>
      {linksDataIndexed ? (
        <LinksContainer
          state={state}
          indexedDB={linksDataIndexed}
          defaultCategories={["top", "commission"]}
          {...props}
        />
      ) : null}
    </>
  );
}
export function FavoriteLinks(props: MeeLinksProps) {
  return (
    <LinksContainer
      title="Favorite Site"
      dir="/fav"
      state={useFavLinks()}
      indexedDB={favLinksDataIndexed}
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
  image,
  title,
  alt,
  style,
}: {
  image?: ImageType | string | null;
  title?: string;
  alt?: string;
  style?: CSSProperties;
}) {
  return (
    <>
      {image ? (
        typeof image === "object" ? (
          <ImageMee
            className="banner"
            imageItem={image}
            alt={alt || title}
            autoPixel={false}
            style={style}
          />
        ) : (
          <img
            className="banner"
            src={image}
            width={200}
            height={40}
            alt={image}
            style={style}
          />
        )
      ) : (
        <div className="banner">
          <span className="plane" style={style}>
            {title || alt}
          </span>
        </div>
      )}
    </>
  );
}

export function Linkat({ hideHeader }: { hideHeader?: boolean }) {
  const { linkat, handle } = useATProtoState();
  const list = useMemo(() => {
    return (linkat || []).filter((v) => {
      const Url = new URL(v.url);
      return Url.host !== import.meta.env.VITE_DOMAIN;
    });
  }, [linkat]);
  const { imageAlbums } = useImageState();
  const linkatAlbum = useMemo(
    () => imageAlbums?.get("linkBanner") || null,
    [imageAlbums]
  );
  const isEditable = useLinksEditMode()[0];
  const [edit, setEdit] = useState<LinkatType | null>(null);
  const isLogin = useIsLogin()[0];
  function Edit({ item }: { item: LinkatType }) {
    const image = linkatAlbum?.list.find((v) => v.link === item.url);
    return <SetLinksImage image={image} link={item?.url} innerNoButton />;
  }
  return (
    <>
      {edit ? (
        <Modal
          onClose={() => {
            setEdit(null);
          }}
        >
          <form className="flex">
            <Edit item={edit} />
            <div>{edit!.url}</div>
            <div className="actions"></div>
          </form>
        </Modal>
      ) : null}
      {list.length > 0 ? (
        <div>
          {hideHeader ? null : (
            <h3 className="color-main en-title-font">
              <a href={"https://linkat.blue/" + handle!} target="_blank">
                Linkat
              </a>
            </h3>
          )}
          {isLogin ? <LinksEditButtons album="linkBanner" /> : null}
          <ul className="linksArea bannerArea">
            {list.map((item, i) => {
              const image = linkatAlbum?.list.find((v) => v.link === item.url);
              return (
                <li key={i}>
                  <a
                    href={item.url}
                    title={item.text}
                    target="_blank"
                    className="overlay"
                    onClick={(e) => {
                      if (isEditable) {
                        e.preventDefault();
                        setEdit(item);
                      }
                    }}
                  >
                    {image ? (
                      <ImageMee
                        alt={`${image.width}×${image.height}バナー`}
                        className="banner"
                        imageItem={image}
                        autoPixel={false}
                        title={item.text}
                      />
                    ) : (
                      <div className="banner">
                        <span className="plane">
                          <span>{item.emoji}</span>
                          <span>{item.text}</span>
                        </span>
                      </div>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </>
  );
}
