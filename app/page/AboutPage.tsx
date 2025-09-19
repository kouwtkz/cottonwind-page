import { CopyWithToast } from "~/components/functions/toastFunction";
import { Link } from "react-router";
import { BiGitBranch } from "react-icons/bi";
import { KeyValueEditable } from "~/components/state/KeyValueDBState";
import { EnvLinksMap } from "~/Env";
import { useMemo } from "react";

export default function AboutPage() {
  return (
    <div className="aboutPage">
      <h1 className="color-main en-title-font">
        <Link to="/about">About</Link>
      </h1>
      <div className="author container">
        <h2 className="color-dark">プロフィール</h2>
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
        <div className="body">
          <div>
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
          <div className="description text-left">
            <KeyValueEditable
              editEnvKey="VITE_KVDB_KEY_AUTHOR_DESCRIPTION"
              editEnvDefault="AUTHOR_DESCRIPTION"
              editType="textarea"
              title="作者の詳細の編集"
            />
          </div>
        </div>
      </div>
      <div className="container">
        <h3 className="color-main" id="guideline">
          <Link to="#guideline">ガイドライン</Link>
        </h3>
        <KeyValueEditable
          editEnvKey="VITE_KVDB_KEY_GUIDELINE"
          editType="textarea"
          title="ガイドラインの編集"
        />
      </div>
      <WebsiteFramework className="container" />
    </div>
  );
}

export function WebsiteFramework({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const githubLink = useMemo(() => EnvLinksMap.get("github"), [EnvLinksMap]);
  return (
    <div {...props}>
      <h3 className="color-main">
        このサイトの構成
        {githubLink ? (
          <a
            className="button miniIcon ml inline-flex"
            href={githubLink.url}
            title={githubLink.title || githubLink.name}
            target="_blank"
          >
            <BiGitBranch />
          </a>
        ) : null}
      </h3>
      <ul className="auto">
        <li>
          サーバー関連
          <ul>
            <li>
              <span className="label">ホスティング</span>
              <span>Cloudflare Workers</span>
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
              <span className="label">使用言語</span>
              <span>TypeScript, SCSS</span>
            </li>
            <li>
              <span className="label">サーバー</span>
              <span>React Router v7</span>
            </li>
            <li>
              <span className="label">クライアント</span>
              <span>React Router v7</span>
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
              <span className="label">メタデータ</span>
              <span>mp3tag.js</span>
            </li>
            <li>
              <span className="label">UIライブラリ</span>
              <span>React-Slider</span>
            </li>
            <li>
              <span className="label">スケジュール</span>
              <span>FullCalendar</span>
            </li>
            <li>
              <span className="label">マンガ</span>
              <span>Laymic, Epub.js</span>
            </li>
          </ul>
        </li>
      </ul>
      {children}
    </div>
  );
}
