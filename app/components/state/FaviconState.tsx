import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router";
import { CreateState } from "./CreateState";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { useCharacters } from "./CharacterState";
import { mediaOrigin } from "~/data/ClientDBLoader";

const defaultLink =
  globalThis.document?.querySelector<HTMLLinkElement>(`link[rel="icon"]`);
const defaultValue = defaultLink?.href;
const element = (() => {
  if (defaultLink) return defaultLink;
  else if (globalThis.document) {
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
  const [isWait, setIsWait] = useState(defaultWait > 0);
  useEffect(() => {
    if (defaultWait > 0)
      setTimeout(() => {
        setIsWait(false);
      }, defaultWait);
  }, []);
  useEffect(() => {
    if (element) {
      if (!isWait && src) {
        if (typeof src === "string") {
          element.href = src;
        } else {
          const imageUrl = new URL(
            concatOriginUrl(mediaOrigin, src.src),
            location.origin
          );
          if (src.version) {
            imageUrl.searchParams.append("v", src.version.toString());
          }
          element.href = imageUrl.href;
        }
      } else if (defaultValue) {
        element.href = defaultValue;
      } else element.setAttribute("href", "/favicon.ico");
    }
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
