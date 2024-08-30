import { EnvAtom } from "@/state/EnvState";
import { useAtom } from "jotai";
import { useMemo } from "react";

export default function ContactPage() {
  return <GoogleForm />;
}

export function GoogleForm() {
  const [env] = useAtom(EnvAtom);
  const CONTACT_FORM_GOOGLE = useMemo(() => {
    if (import.meta.env.DEV) return env?.CONTACT_FORM_GOOGLE_DEV;
    else return env?.CONTACT_FORM_GOOGLE;
  }, [env]);
  return (
    <>
      {CONTACT_FORM_GOOGLE ? (
        <>
          <h3>
            <a href={CONTACT_FORM_GOOGLE + "/viewform"}>
              お問い合わせ（Googleフォーム）
            </a>
          </h3>
          <iframe
            title="おといあわせ"
            src={CONTACT_FORM_GOOGLE + "/viewform?embedded=true"}
            width="640"
            height="1150"
            style={{ margin: 0, border: "none" }}
          >
            読み込んでいます…
          </iframe>
        </>
      ) : null}
    </>
  );
}
