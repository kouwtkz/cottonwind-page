import { useEffect, useState } from "react";
import { CreateState } from "./CreateState";
import { useMediaOrigin } from "./EnvState";
import { concatOriginUrl } from "@/functions/originUrl";

const defaultLink = document.querySelector<HTMLLinkElement>(`link[rel="icon"]`);
const defaultValue = defaultLink?.href;
const element = (() => {
  if (defaultLink) return defaultLink;
  else {
    const link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
    return link;
  }
})();
export const useFaviconState = CreateState<string | ImageType | null>();

export function FaviconState() {
  const src = useFaviconState()[0];
  const mediaOrigin = useMediaOrigin()[0];
  const [isWait, setIsWait] = useState(true);
  useEffect(() => {
    let timer = 0;
    if (/Firefox/.test(navigator.userAgent)) timer = 250;
    if (timer) {
      setTimeout(() => {
        setIsWait(false);
      }, timer);
    } else setIsWait(false);
  }, []);
  useEffect(() => {
    if (!isWait && src) {
      if (typeof src === "string") {
        element.href = src;
      } else {
        element.href = concatOriginUrl(mediaOrigin, src.src);
      }
    } else if (defaultValue) {
      element.href = defaultValue;
    } else element.removeAttribute("href");
  }, [src, mediaOrigin, isWait]);
  return <></>;
}
