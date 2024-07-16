import { ChangeLog } from "@/state/GitState";

export default function AboutPage() {
  return (
    <div className="aboutPage">
      <h2 className="lulo">About</h2>
      <h3>プロフィール</h3>
      <h4>{import.meta.env.VITE_AUTHOR_NAME}</h4>
      <h5>
        {import.meta.env.VITE_AUTHOR_EN_NAME_ON_PROP ||
          import.meta.env.VITE_AUTHOR_EN_NAME}
      </h5>
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
      <ChangeLog />
    </div>
  );
}
