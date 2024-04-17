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
          href="?invite=discord"
          onClick={(e) => {
            e.preventDefault();
            const answer = prompt("わたかぜコウの代理キャラクターの名前は？");
            if (answer !== null) {
              axios
                .post("/discord/invite/fetch", { invite_password: answer })
                .then((r) => {
                  open(r.data);
                })
                .catch((e) => {
                  toast.error(`認証に失敗しました [${e}]`);
                });
            }
          }}
        >
          Discordのコミュニティサーバー
        </a>
      </div>
    </div>
  );
}
