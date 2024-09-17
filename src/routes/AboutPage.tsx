import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ImageMee } from "@/layout/ImageMee";
import { useEnv } from "@/state/EnvState";
import { ChangeLog } from "@/state/GitState";
import { useImageState } from "@/state/ImageState";

export default function AboutPage() {
  const [env] = useEnv();
  const { imagesMap } = useImageState();
  const authorImage = useMemo(() => {
    if (env?.AUTHOR_IMAGE && imagesMap) return imagesMap.get(env.AUTHOR_IMAGE);
  }, [imagesMap, env?.AUTHOR_IMAGE]);
  return (
    <div className="aboutPage">
      <h2 className="color en-title-font">About</h2>
      <h3>プロフィール</h3>
      {env ? (
        <>
          <h4>{env.AUTHOR_NAME}</h4>
          <h5>{env.AUTHOR_EN_NAME_ON_PROP || env.AUTHOR_EN_NAME}</h5>
          {authorImage ? (
            <ImageMee
              className="authorImage"
              imageItem={authorImage}
              alt="プロフィール画像"
            />
          ) : null}
        </>
      ) : null}
      <div>
        <p>わたかぜコウです！</p>
        <p>もふもふなイラストを描くのが好きです！</p>
      </div>
      <h5>
        <Link to="/blog">サイト内ブログ</Link>
      </h5>
      <ChangeLog />
    </div>
  );
}
