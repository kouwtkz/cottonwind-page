import axios from "axios";
import toast from "react-hot-toast";

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
        <a
          title="Discordの招待リンク（合言葉入力式）"
          href="#discord"
          target="discord"
          onClick={(e) => {
            const element = e.target as HTMLAnchorElement;
            if (!element.hasAttribute("invited")) {
              e.preventDefault();
              const answer = prompt("わたかぜコウの代理キャラクターの名前は？");
              if (answer !== null) {
                axios
                  .post("/discord/invite/fetch", { invite_password: answer })
                  .then((r) => {
                    element.title = "Discordの招待リンク"
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
          Discordのコミュニティサーバー
        </a>
      </div>
    </div>
  );
}
