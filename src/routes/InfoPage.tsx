import axios from "axios";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { useDataState } from "../state/StateSet";

export default function InfoPage() {
  return (
    <div className="infoPage">
      <h2>Infomation</h2>
      <h3>プロフィール</h3>
      <div>
        <p>わたかぜコウです！</p>
        <p>もふもふなイラストを描くのが好きです！</p>
      </div>
      <div>
        <InviteDiscordLink />
      </div>
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
      onClick={(e) => {
        const element = anchorRef.current!;
        if (!element.hasAttribute("invited")) {
          e.preventDefault();
          const answer = prompt("わたかぜコウの代理キャラクターの名前は？");
          if (answer !== null) {
            axios
              .post("/discord/invite/fetch", { invite_password: answer })
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
