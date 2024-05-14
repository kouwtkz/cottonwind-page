import axios from "axios";
import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { useDataState } from "../state/StateSet";
import { MakeRelativeURL } from "../components/doc/MakeURL";
import { ChangeLog } from "@/state/FeedRead";

export default function AboutPage() {
  return (
    <div className="aboutPage">
      <h2>About</h2>
      <h3>プロフィール</h3>
      {import.meta.env.VITE_AUTHOR_IMAGE ? (
        <img
          className="authorImage"
          src={import.meta.env.VITE_AUTHOR_IMAGE}
          alt="プロフィール画像"
        />
      ) : null}
      <div>
        <p>わたかぜコウです！</p>
        <p>もふもふなイラストを描くのが好きです！</p>
      </div>
      <div>
        <InviteDiscordLink />
      </div>
      <p>
        <a href="/suggest">Suggest page (links for miss typo)</a>
      </p>
      <ChangeLog />
    </div>
  );
}

function InviteDiscordLink({
  children = "Discordのコミュニティサーバー",
}: {
  children?: React.ReactNode;
}) {
  const [search, setSearch] = useSearchParams();
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const invite = search.get("invite");
  const { isComplete } = useDataState();
  const question = useMemo(async () => {
    return axios.get("/fetch/discord/invite").then((r) => r.data);
  }, []);
  useEffect(() => {
    if (isComplete && invite === "discord") {
      anchorRef.current!.click();
      search.delete("invite");
      setSearch(search, { replace: true, preventScrollReset: true });
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
