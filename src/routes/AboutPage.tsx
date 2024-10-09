import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ImageMee } from "@/layout/ImageMee";
import { useEnv } from "@/state/EnvState";
import { ChangeLog } from "@/state/GitState";
import { useImageState } from "@/state/ImageState";
import { CopyWithToast } from "@/functions/toastFunction";

export default function AboutPage() {
  const [env] = useEnv();
  const { imagesMap } = useImageState();
  const authorImage = useMemo(() => {
    if (env?.AUTHOR_IMAGE && imagesMap) return imagesMap.get(env.AUTHOR_IMAGE);
  }, [imagesMap, env?.AUTHOR_IMAGE]);
  return (
    <div className="aboutPage">
      <h1 className="color-main en-title-font">About</h1>
      <h2 className="color-dark">プロフィール</h2>
      {env ? (
        <>
          <h3 className="color-main">{env.AUTHOR_NAME}</h3>
          <h4 className="color-soft">
            {env.AUTHOR_EN_NAME_ON_PROP || env.AUTHOR_EN_NAME}
          </h4>
          {authorImage ? (
            <ImageMee
              className="authorImage"
              imageItem={authorImage}
              alt="プロフィール画像"
            />
          ) : null}
        </>
      ) : null}
      <div className="container">
        <p>わたかぜコウです！</p>
        <p>もふもふなイラストを描くのが好きです！</p>
      </div>
      <div className="container">
        <h3 className="color-main">ガイドライン</h3>
        <p>わたかぜコウのキャラクターはファンアート歓迎しています！</p>
        <p>
          ファンアートタグは
          <span
            className="color-deep pointer"
            onClick={(e) => {
              const elm = e.target as HTMLElement;
              if (elm?.innerText) CopyWithToast(elm.innerText);
            }}
          >
            #わたかぜメ絵
          </span>
          を活用してください！
        </p>
      </div>
      <div className="container">
        <h4 className="color-deep">やっていいこと</h4>
        <ul>
          <li>ファンアートを描くことや二次創作をすること</li>
          <li>非営利目的で二次創作グッズや同人誌を作ること</li>
          <li>擬人化や獣化、マスコット化などのアレンジをすること</li>
        </ul>
      </div>
      <div className="container">
        <h4 className="color-warm">やってほしくないこと</h4>
        <ul>
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
      <ChangeLog />
    </div>
  );
}
