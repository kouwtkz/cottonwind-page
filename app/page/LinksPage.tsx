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
  type LinksMapType,
  type LinksStateType,
  useFavLinks,
  type LinksIndexedDBType,
} from "~/components/state/LinksState";
import { useEnv, useIsLogin } from "~/components/state/EnvState";
import { ImageMee } from "~/components/layout/ImageMee";
import { CreateState } from "~/components/state/CreateState";
import {
  LinksEdit,
  MyBannerEditButtons,
  useMoveMyBanner,
  LinksEditButtons,
  type editLinksType,
  type SendLinksDir,
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
import { CompatGalleryButton } from "./edit/ImagesManager";
import { findMee } from "~/data/find/findMee";
import { customFetch } from "~/components/functions/fetch";
import {
  GetAPIFromOptions,
  ImageDataOptions,
  linksDataOptions,
} from "~/data/DataEnv";
import { EnvLinksMap } from "~/Env";

const LINKS_API = GetAPIFromOptions(linksDataOptions);
const IMAGE_SEND_API = GetAPIFromOptions(ImageDataOptions, "/send");

export default function LinksPage() {
  const env = useEnv()[0];
  const githubLink = useMemo(() => EnvLinksMap.get("github"), [EnvLinksMap]);
  const topLinkTitle = useMemo(() => {
    let title: string | undefined;
    if (env?.AUTHOR_NAME) title = env.AUTHOR_NAME + "のリンクたち";
    return title;
  }, [env]);
  return (
    <div className="linkPage">
      <h2 className="color-main en-title-font">LINKS</h2>
      <MeeLinks title="トップリンク" category="top" banner />
      <MeeLinks
        title={topLinkTitle}
        category={null}
        banner
        linkStyle={{ minHeight: "3em" }}
      />
      <MeeLinks
        title="コミッション"
        category="commission"
        banner
        linkStyle={{ minHeight: "3em" }}
      />
      <div>
        <h3 className="leaf">いろいろ</h3>
        <ul className="flex center column font-larger">
          <li>
            <InviteDiscordLink />
          </li>
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
  const [question, setQuestion] = useState<string>();
  useEffect(() => {
    fetch("/api/discord/invite")
      .then((r) => r.text())
      .then((value) => {
        setQuestion(value);
      });
  }, []);
  useEffect(() => {
    if (invite === "discord") {
      anchorRef.current!.click();
      searchParams.delete("invite");
      setSearchParams(searchParams, {
        replace: true,
        preventScrollReset: true,
      });
    }
  }, [invite]);
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
            fetch(
              MakeRelativeURL({
                pathname: "/api/discord/invite",
                query: { invite_password: answer },
              })
            )
              .then((r) => r.text())
              .then((data) => {
                element.title = "Discordの招待リンク";
                element.href = data;
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
  state: LinksStateType;
  indexedDB: LinksIndexedDBType;
  defaultCategories?: string[];
  linkStyle?: CSSProperties;
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
  ...props
}: LinksContainerProps) {
  const send = LINKS_API + dir + "/send";
  const album = useMemo(() => (banner ? "linkBanner" : "linksImage"), [banner]);
  const links = useMemo(
    () =>
      state.links
        ? findMee(state.links, {
            where: { category },
            orderBy: [{ id: "asc", order: "asc" }],
          })
        : [],
    [category, state.links]
  );
  const [edit, setEdit] = useState<editLinksType>();
  const [move, setMove] = useState(0);
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
      return banner ? (
        <BannerItem
          item={item}
          isEdit={isEditable}
          setEditLink={setEdit}
          style={linkStyle}
        />
      ) : (
        <a
          href={item.url || ""}
          className="overlay"
          target="_blank"
          style={linkStyle}
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
    [isEditable, banner, linkStyle]
  );
  const visible = useMemo(() => isLogin || links.length > 0, [isLogin, links]);
  return (
    <>
      {visible ? (
        <div className={className} {...props}>
          {edit ? (
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
          {title ? <h3 className="leaf">{title || "リンク集"}</h3> : null}
          {isLogin ? (
            <LinksEditButtons
              state={state}
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
                        indexedDB.load("no-cache");
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
          defaultCategories={["commission"]}
          {...props}
        />
      ) : null}
    </>
  );
}
export function FavoriteLinks(props: MeeLinksProps) {
  return (
    <>
      {favLinksDataIndexed ? (
        <LinksContainer
          title="お気に入りのサイト"
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
      ) : null}
    </>
  );
}

export function getTitleWithDsc(item: SiteLink) {
  return item.title + (item.description ? " - " + item.description : "");
}

export function BannerInner({
  item,
  title,
  alt,
  style,
}: {
  item?: SiteLink | null;
  title?: string;
  alt?: string;
  style?: CSSProperties;
}) {
  return (
    <>
      {item?.Image ? (
        <ImageMee
          className="banner"
          imageItem={item.Image}
          alt={alt || getTitleWithDsc(item)}
          autoPixel={false}
          style={style}
        />
      ) : item?.image ? (
        <img
          className="banner"
          src={item.image}
          width={200}
          height={40}
          alt={item.image}
          style={style}
        />
      ) : (
        <div className="banner">
          <span className="plane" style={style}>
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
  style,
}: {
  item: SiteLink;
  isEdit?: boolean;
  setEditLink: (v?: number | boolean) => void;
  style?: CSSProperties;
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
      <BannerInner item={item} alt={titleWithDsc} style={style} />
    </a>
  );
}
