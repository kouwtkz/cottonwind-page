import { useMemo } from "react";
import { useEnv } from "@/state/EnvState";

export default function ContactPage() {
  return <GoogleForm />;
}

export function GoogleForm() {
  const [env] = useEnv();
  const CONTACT_FORM_GOOGLE = env?.CONTACT_FORM_GOOGLE;
  const FORM_GOOGLE_BASE_URL = "https://docs.google.com/forms/u/0/d/e/";
  return (
    <>
      {CONTACT_FORM_GOOGLE ? (
        <>
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
        </>
      ) : null}
    </>
  );
}
