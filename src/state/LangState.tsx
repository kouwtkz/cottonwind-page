import { useLayoutEffect } from "react";
import { CreateState } from "./CreateState";

const useLang = CreateState<string>();

export function LangState() {
  const [lang, setLang] = useLang();
  useLayoutEffect(() => {
    const html = document.querySelector("html")!;
    setLang(html.lang);
    const observer = new MutationObserver((r) => {
      r.filter((o) => o.attributeName === "lang").forEach((o) => {
        const targetLang = (o.target as HTMLElement).lang;
        setLang(targetLang);
      });
    });
    observer.observe(html, {
      attributes: true,
      childList: false,
    });
  }, [setLang]);
  return <></>;
}
