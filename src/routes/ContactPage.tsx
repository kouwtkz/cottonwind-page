import { useMemo } from "react";
import { useEnv } from "@/state/EnvState";
import { RiLinksFill } from "react-icons/ri";
import { Link } from "react-router-dom";
import { CopyWithToast } from "@/functions/toastFunction";

export default function ContactPage() {
  const env = useEnv()[0];
  return (
    <>
      <h2 className="color-main en-title-font line-none">
        <Link to="/contact">CONTACT</Link>
      </h2>
      <div className="p-br-2">
        <p>このサイトのコンテンツやご依頼、</p>
        <p>「わたかぜっこ」についてのお問い合わせは</p>
        <p>
          以下の<a href="#form">フォーム</a>
          {env?.EMAIL ? <>かメールアドレス</> : null}にて承っています！
        </p>
      </div>
      {env?.EMAIL ? (
        <p>
          <a
            onClick={() => {
              CopyWithToast(env.EMAIL!);
            }}
          >
            {env.EMAIL.replace("@", "🐏")}
          </a>
        </p>
      ) : null}
      <GoogleForm />
    </>
  );
}

export function GoogleForm() {
  const [env] = useEnv();
  const CONTACT_FORM_GOOGLE = env?.CONTACT_FORM_GOOGLE;
  const FORM_GOOGLE_BASE_URL = "https://docs.google.com/forms/u/0/d/e/";
  return (
    <>
      {CONTACT_FORM_GOOGLE ? (
        <div id="form">
          <h3>
            <a href={FORM_GOOGLE_BASE_URL + CONTACT_FORM_GOOGLE + "/viewform"}>
              お問い合わせ（Googleフォーム）
            </a>
          </h3>
          <iframe
            title="おといあわせ"
            className="contactForm"
            src={
              FORM_GOOGLE_BASE_URL +
              CONTACT_FORM_GOOGLE +
              "/viewform?embedded=true"
            }
            width="640"
            height="1150"
          >
            読み込んでいます…
          </iframe>
        </div>
      ) : null}
    </>
  );
}
