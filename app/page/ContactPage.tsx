import { useMemo } from "react";
import { useEnv } from "~/components/state/EnvState";
import { RiLinksFill } from "react-icons/ri";
import { Link } from "react-router";
import { CopyWithToast } from "~/components/functions/toastFunction";
import { useLang } from "~/components/multilingual/LangState";
import { DEFAULT_LANG, TITLE, TITLE_EN } from "~/Env";

export default function ContactPage() {
  const env = useEnv()[0];
  const lang = useLang()[0];
  const title = useMemo(
    () =>
      (lang === DEFAULT_LANG ? TITLE : TITLE_EN) ??
      (typeof document !== "undefined" ? document.title : ""),
    [lang]
  );
  return (
    <>
      <h2 className="color-main en-title-font line-none">
        <Link to="/contact">CONTACT</Link>
      </h2>
      <div className="p-br-2">
        <p>ご依頼や「{title}」関連についてのお問い合わせは</p>
        <p>
          以下の<a href="#form">フォーム</a>
          {env?.EMAIL ? <>かメールアドレス</> : null}にて承っています！
        </p>
        {env?.EMAIL ? (
          <p>
            （メールアドレスは受付用のため、Gmailのアドレスに案内する場合もあります）
          </p>
        ) : null}
      </div>
      {env?.EMAIL ? (
        <p>
          <a
            onClick={() => {
              CopyWithToast(env.EMAIL!);
            }}
            className="font-larger"
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
