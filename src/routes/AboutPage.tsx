import { useMemo } from "react";
import { ImageMee } from "@/layout/ImageMee";
import { useEnv } from "@/state/EnvState";
import { useImageState } from "@/state/ImageState";
import { CopyWithToast } from "@/functions/toastFunction";
import { Link } from "react-router-dom";
import { BiGitBranch } from "react-icons/bi";
import { KeyValueEditable, useKeyValueDB } from "@/state/KeyValueDBState";
import { MultiParser } from "@/components/parse/MultiParser";

const key_author_name = import.meta.env!.VITE_KVDB_KEY_AUTHOR_NAME;
const key_author_name_en = import.meta.env!.VITE_KVDB_KEY_AUTHOR_NAME_EN;
const key_author_name_en_prop = import.meta.env!
  .VITE_KVDB_KEY_AUTHOR_NAME_EN_PROP;
const key_author_image = import.meta.env!.VITE_KVDB_KEY_AUTHOR_IMAGE;
const key_author_description = import.meta.env!
  .VITE_KVDB_KEY_AUTHOR_DESCRIPTION;

export default function AboutPage() {
  return (
    <div className="aboutPage">
      <h1 className="color-main en-title-font">
        <Link to="/about">About</Link>
      </h1>
      <h2 className="color-dark">プロフィール</h2>
      <div className="author">
        <h3 className="color-main">
          <KeyValueEditable
            editEnvKey="VITE_KVDB_KEY_AUTHOR_NAME"
            editEnvDefault="AUTHOR_NAME"
          />
        </h3>
        <div className="on-en-prop">
          <h4 className="color-soft">
            <KeyValueEditable
              editEnvKey="VITE_KVDB_KEY_AUTHOR_NAME_EN"
              editEnvDefault="AUTHOR_EN_NAME"
            />
          </h4>
          <p className="color-soft">
            <KeyValueEditable
              editEnvKey="VITE_KVDB_KEY_AUTHOR_NAME_EN_PROP"
              editEnvDefault="AUTHOR_EN_PROP"
              replaceValue="[$1]"
            />
          </p>
        </div>
        <KeyValueEditable
          editEnvKey="VITE_KVDB_KEY_AUTHOR_IMAGE"
          editEnvDefault="AUTHOR_IMAGE"
          imageMeeProps={{
            className: "authorImage",
            alt: "プロフィール画像",
          }}
          editType="image"
        />
      </div>
      <div className="container">
        <KeyValueEditable
          editEnvKey="VITE_KVDB_KEY_AUTHOR_DESCRIPTION"
          editEnvDefault="AUTHOR_DESCRIPTION"
          editType="textarea"
        />
      </div>
      <div className="container">
        <h3 className="color-main" id="guideline">
          <Link to="#guideline">ガイドライン</Link>
        </h3>
        <p>
          わたかぜコウのキャラクターは公序良俗に則っていれば、ファンアートを描いてくれるのを歓迎してます！
        </p>
        <p>
          ファンアートタグは
          <span
            className="color-deep pointer hashtag"
            onClick={(e) => {
              const elm = e.target as HTMLElement;
              if (elm?.innerText) CopyWithToast(elm.innerText);
            }}
          >
            #わたかぜメ絵
          </span>
          です！
        </p>
      </div>
      <div className="container">
        <h4 className="color-deep">
          <span className="mr-s">○</span>やっていいこと
        </h4>
        <ul className="sm">
          <li>ファンアートを描くことや二次創作をすること</li>
          <li>非営利目的で二次創作グッズや同人誌を作ること</li>
        </ul>
      </div>
      <div className="container">
        <h4 className="color-warm">
          <span className="mr-s">×</span>やってほしくないこと
        </h4>
        <ul className="sm">
          <li>
            キャラクターと大きく異なる改変をすること
            <ul>
              <li>
                改変の内容によりますが、改変度合いが大きいほど喜ばないリスクが高くミュートなどの対応をとることがあります。
              </li>
              <li>OK: 絵柄の範疇のアレンジ（そういうのは歓迎してます！！）</li>
              <li>
                OK: 獣化、マスコット化などのかわいくなる方向のアレンジをすること
              </li>
              <li>OK: 擬人化でかわいくする意識を持たせてアレンジすること</li>
              <li>
                NG: 変身能力持ちではないのに全く異なる形態に変えること{"\n"}
                （大きく変えても良いけど、ぼくが喜ばない可能性が高いです）
              </li>
            </ul>
          </li>
          <li>性的、嗜虐的な表現をすること（ゾーニングしてください）</li>
          <li>作品を悪用すること（転載、自作発言、機械学習など）</li>
          <li>作品やキャラクターを無断で商業利用すること</li>
          <li>他人を毀損する目的の表現をすること</li>
          <li>政治的、宗教的な目的で使用すること</li>
        </ul>
      </div>
      <WebsiteFramework className="container" />
    </div>
  );
}

export function WebsiteFramework({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
      <h3 className="color-main">
        このサイトの構成
        <Link
          className="button miniIcon ml inline-flex"
          to="/log"
          state={{ backUrl: location.href }}
          title="サイトの更新履歴 (Git)"
        >
          <BiGitBranch />
        </Link>
      </h3>
      <ul className="sm">
        <li>
          サーバー関連
          <ul>
            <li>
              <span className="label">ホスティング</span>
              <span>Cloudflare Pages</span>
            </li>
            <li>
              <span className="label">ドメイン</span>
              <span>Cloudflare Registrar</span>
            </li>
            <li>
              <span className="label">データベース</span>
              <span>Cloudflare D1</span>
            </li>
            <li>
              <span className="label">画像やファイル</span>
              <span>Cloudflare R2</span>
            </li>
          </ul>
        </li>
        <li>
          フレームワーク
          <ul>
            <li>
              <span className="label">サーバー</span>
              <span>Hono</span>
            </li>
            <li>
              <span className="label">クライアント</span>
              <span>React Router DOM</span>
            </li>
            <li>
              <span className="label">ビルダー</span>
              <span>Vite</span>
            </li>
          </ul>
        </li>
        <li>
          コンポーネント
          <ul>
            <li>
              <span className="label">アイコン</span>
              <span>react-icons</span>
            </li>
            <li>
              <span className="label">マークダウン</span>
              <span>marked</span>
            </li>
            <li>
              <span className="label">タグ選択</span>
              <span>react-select</span>
            </li>
            <li>
              <span className="label">トースト</span>
              <span>react-toastify</span>
            </li>
            <li>
              <span className="label">状態管理</span>
              <span>zustand</span>
            </li>
            <li>
              <span className="label">プレイヤー</span>
              <span>@mebtte/react-media-session</span>
            </li>
            <li>
              <span className="label">UIライブラリ</span>
              <span>React-Slider</span>
            </li>
            <li>
              <span className="label">マンガ</span>
              <span>react-comic-viewer, Epub.js</span>
            </li>
          </ul>
        </li>
      </ul>
      {children}
    </div>
  );
}
