import { useEffect, useMemo, useState } from "react";
import { CreateState } from "./CreateState";
import { useMediaOrigin } from "./EnvState";
import { concatOriginUrl } from "@/functions/originUrl";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { useCharacters } from "./CharacterState";

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

let defaultWait = 0;
if (/Firefox/.test(navigator.userAgent)) defaultWait = 250;

export function FaviconState() {
  return (
    <>
      <FaviconSystemState />
      <FaviconSetState />
    </>
  );
}

function FaviconSystemState() {
  const src = useFaviconState()[0];
  const mediaOrigin = useMediaOrigin()[0];
  const [isWait, setIsWait] = useState(defaultWait > 0);
  useEffect(() => {
    if (defaultWait > 0)
      setTimeout(() => {
        setIsWait(false);
      }, defaultWait);
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

function FaviconSetState() {
  const setFavicon = useFaviconState()[1];
  const params = useParams();
  const location = useLocation();
  const searchParams = useSearchParams()[0];
  const { charactersMap } = useCharacters();
  const icon = useMemo(() => {
    const character = params.charaName
      ? charactersMap.get(params.charaName) || null
      : null;
    if (character?.icon) {
      return character.icon;
    } else {
      return null;
    }
  }, [location, params, searchParams, charactersMap]);
  useEffect(() => {
    setFavicon(icon);
  }, [icon]);
  return <></>;
}
