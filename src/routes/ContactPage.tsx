export default function ContactPage() {
  return <GoogleForm />;
}

export function GoogleForm() {
  return (
    <>
      {import.meta.env.VITE_CONTACT_FORM_GOOGLE ? (
        <>
          <h3>
            <a href={import.meta.env.VITE_CONTACT_FORM_GOOGLE + "/viewform"}>
              お問い合わせ（Googleフォーム）
            </a>
          </h3>
          <iframe
            title="おといあわせ"
            src={
              import.meta.env.VITE_CONTACT_FORM_GOOGLE +
              "/viewform?embedded=true"
            }
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
