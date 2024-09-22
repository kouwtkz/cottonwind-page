import axios from "axios";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { useDataIsComplete } from "@/state/StateSet";
import { MakeRelativeURL } from "@/functions/doc/MakeURL";
import { LinksStateClass } from "@/state/LinksState";
import { useEnv } from "@/state/EnvState";

export default function LinksPage() {
  const [env] = useEnv();
  return (
    <div className="linkPage">
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
      <div>
        <h3 className="leaf">お気に入りのサイト</h3>
        <FavoriteLinks />
      </div>
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
            <img src={src} alt={`${w}×${h}バナー"`} width={w} height={h} className="banner" />
          </a>
        </div>
      ))}
    </div>
  );
}

export const FavoriteLinksState = new LinksStateClass(
  "/data/favorite_links.json"
);

export function FavoriteLinks() {
  const { list } = FavoriteLinksState.use();
  return (
    <>
      {FavoriteLinksState.State()}
      <div className="bannerArea">
        {list?.map((v, i) => {
          const titleWithDsc =
            v.title + (v.description ? " - " + v.description : "");
          return (
            <a
              href={v.url}
              title={titleWithDsc}
              target="_blank"
              className="overlay"
              key={i}
            >
              <img
                src={v.image ?? ""}
                width={200}
                height={40}
                alt={titleWithDsc}
              />
            </a>
          );
        })}
      </div>
    </>
  );
}
