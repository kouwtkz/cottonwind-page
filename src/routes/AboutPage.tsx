import { useMemo } from "react";
import { ImageMee } from "@/layout/ImageMee";
import { useEnv } from "@/state/EnvState";
import { useImageState } from "@/state/ImageState";
import { CopyWithToast } from "@/functions/toastFunction";
import { Link } from "react-router-dom";
import { BiGitBranch } from "react-icons/bi";

export default function AboutPage() {
  const env = useEnv()[0];
  const { imagesMap } = useImageState();
  const authorImage = useMemo(() => {
    if (env?.AUTHOR_IMAGE && imagesMap) return imagesMap.get(env.AUTHOR_IMAGE);
  }, [imagesMap, env?.AUTHOR_IMAGE]);
  return (
    <div className="aboutPage">
      <h1 className="color-main en-title-font">About</h1>
      <h2 className="color-dark">プロフィール</h2>
      {env ? (
        <div className="author">
          <h3 className="color-main">{env.AUTHOR_NAME}</h3>
          <div className="on-en-prop">
            <h4 className="color-soft">{env.AUTHOR_EN_NAME}</h4>
            {env.AUTHOR_EN_PROP ? (
              <p className="color-soft">[{env.AUTHOR_EN_PROP}]</p>
            ) : null}
          </div>
          {authorImage ? (
            <ImageMee
              className="authorImage"
              imageItem={authorImage}
              alt="プロフィール画像"
            />
          ) : null}
        </div>
      ) : null}
      <div className="container">
        <p>わたかぜコウです！</p>
        <p>もふもふなイラストを描くのが好きです！</p>
      </div>
      <div className="container">
        <h3 className="color-main">ガイドライン</h3>
        <p>
          わたかぜコウのキャラクターはファンアートを描いてくれるのを歓迎してます！
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
          <li>擬人化や獣化、マスコット化などのアレンジをすること</li>
        </ul>
      </div>
      <div className="container">
        <h4 className="color-warm">
          <span className="mr-s">×</span>やってほしくないこと
        </h4>
        <ul className="sm">
          <li>作品を悪用すること（転載、自作発言、機械学習など）</li>
          <li>作品やキャラクターを無断で商業利用すること</li>
          <li>
            性的、嗜虐的な表現をすること{"\n"}
            （ぼくは苦手なのでゾーニングしてください）{"\n"}
            （キャラクター性と無関係な膨張の表現も含みます）
          </li>
          <li>他人を毀損する目的の表現をすること</li>
          <li>政治的、宗教的な目的で使用すること</li>
        </ul>
      </div>
      <div className="container">
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
                <span>zustand, jotai</span>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}
