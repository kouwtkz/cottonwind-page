import axios from "axios";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { useDataIsComplete } from "@/state/StateSet";
import { MakeRelativeURL } from "@/functions/doc/MakeURL";
import { LinksState, useFavLinks } from "@/state/LinksState";
import { useEnv, useIsLogin } from "@/state/EnvState";
import { ImageMee } from "@/layout/ImageMee";
import { CreateState } from "@/state/CreateState";
import { AddButton, EditModeSwitch } from "./edit/CommonSwitch";
import { FavBannerEdit, useEditFavLinkID } from "./edit/LinksEdit";

export default function LinksPage() {
  const [env] = useEnv();
  return (
    <div className="linkPage">
      <LinksState />
      <h2 className="color-main en-title-font">LINKS</h2>
      <div>
        <h3 className="leaf">各拠点</h3>
        <ul className="flex center column large">
          {env?.LINKS?.map((item, i) => {
            return (
              <li key={i}>
                <a href={item.url} target="_blank">
                  {item.title ?? item.name}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <h3 className="leaf">いろいろ</h3>
        <ul className="flex center column large">
          <li>
            <InviteDiscordLink />
          </li>
          <li>
            <a href="/suggest">Suggest page (links for miss typo)</a>
          </li>
        </ul>
      </div>
      <div>
        <h3 className="leaf">サイトのバナー</h3>
        <MyBanners />
      </div>
      <FavoriteLinks />
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

const myBanners: { w: number; h: number; src: string }[] = [
  { w: 200, h: 40, src: "/static/images/banner/banner_cottonwind_200_40.png" },
  { w: 234, h: 60, src: "/static/images/banner/banner_cottonwind_234_60.png" },
];

export function MyBanners() {
  return (
    <div className="bannerArea">
      {myBanners.map(({ w, h, src }, i) => (
        <div key={i}>
          <div>
            {w}×{h} px
          </div>
          <a href={src} target="banner" className="overlay">
            <img
              src={src}
              alt={`${w}×${h}バナー"`}
              width={w}
              height={h}
              className="banner"
            />
          </a>
        </div>
      ))}
    </div>
  );
}

export const useFavoriteLinksEditMode = CreateState(false);

export function FavoriteLinks() {
  const list = useFavLinks()[0];
  const [edit, setEdit] = useEditFavLinkID();
  const isLogin = useIsLogin()[0];
  return (
    <div>
      {edit ? <FavBannerEdit /> : null}
      <h3 className="leaf">お気に入りのサイト</h3>
      {isLogin ? (
        <div>
          <EditModeSwitch useSwitch={useFavoriteLinksEditMode} />
          <AddButton
            onClick={() => {
              setEdit(true);
            }}
          />
        </div>
      ) : null}
      <div className="bannerArea">
        {list?.map((v, i) => (
          <BannerItem item={v} key={i} />
        ))}
      </div>
    </div>
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
          style={{ width: 200, height: 40 }}
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
        <div style={{ width: 200, height: 40 }} className="banner">
          {title || item?.title}
        </div>
      )}
    </>
  );
}

export function BannerItem({ item }: { item: SiteLink }) {
  const isEdit = useFavoriteLinksEditMode()[0];
  const setEditLink = useEditFavLinkID()[1];
  const titleWithDsc = getTitleWithDsc(item);
  return (
    <a
      href={item.url || ""}
      title={titleWithDsc}
      target="_blank"
      className="overlay flex"
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
