import { useEffect } from "react";
import { CreateState } from "./CreateState";
import { favLinksDataObject, linksDataObject } from "./DataState";
import { useImageState } from "./ImageState";

export const useLinks = CreateState<SiteLink[]>();
export const useLinksMap = CreateState<Map<string, SiteLink[]>>();
export const useFavLinks = CreateState<SiteLink[]>();

function convertSiteLink(
  data: SiteLinkData,
  imagesMap?: Map<string, ImageType>
): SiteLink {
  const { url, draft, lastmod, ...other } = data;
  return {
    url: String(url),
    draft: typeof draft === "number" ? Boolean(draft) : undefined,
    lastmod: typeof lastmod === "string" ? new Date(lastmod) : lastmod,
    Image:
      other.image && imagesMap && imagesMap.has(other.image)
        ? imagesMap.get(other.image)!
        : undefined,
    ...other,
  };
}

export function LinksState() {
  const linksData = linksDataObject.useData()[0];
  const setLinks = useLinks()[1];
  const setLinkMaps = useLinksMap()[1];
  const { imagesMap } = useImageState();
  useEffect(() => {
    if (linksData && imagesMap) {
      const list = linksData
        .filter((data) => data.url || data.title || data.image)
        .map((data) => convertSiteLink(data, imagesMap));
      list.sort((a, b) => (a.order || 0xffff) - (b.order || 0xffff));
      const map = new Map<string, SiteLink[]>();
      list.forEach((item) => {
        const category = item.category || "";
        let links = map.get(category);
        if (!links) {
          links = [];
          map.set(category, links);
        }
        links.push(item);
      });
      setLinkMaps(map);
      setLinks(list);
    }
  }, [linksData, imagesMap, setLinks, setLinkMaps]);
  const favLinksData = favLinksDataObject.useData()[0];
  const setFavLinks = useFavLinks()[1];
  useEffect(() => {
    if (favLinksData && imagesMap) {
      const list = favLinksData
        .filter((data) => data.url || data.title || data.image)
        .map((data) => convertSiteLink(data, imagesMap));
      list.sort((a, b) => (a.order || 0xffff) - (b.order || 0xffff));
      setFavLinks(list);
    }
  }, [favLinksData, setFavLinks, imagesMap]);
  return <></>;
}
