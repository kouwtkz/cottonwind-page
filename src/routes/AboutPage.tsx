import { useEnv } from "@/state/EnvState";
import { ChangeLog } from "@/state/GitState";
import { Link } from "react-router-dom";

export default function AboutPage() {
  const [env] = useEnv();
  return (
    <div className="aboutPage">
      <h2 className="color en-title-font">About</h2>
      <h3>プロフィール</h3>
      {env ? (
        <>
          <h4>{env.AUTHOR_NAME}</h4>
          <h5>
            {env.AUTHOR_EN_NAME_ON_PROP ||
              env.AUTHOR_EN_NAME}
          </h5>
          {env.AUTHOR_IMAGE ? (
            <img
              className="authorImage"
              src={env.AUTHOR_IMAGE}
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
