import { useCallback, useEffect, useSyncExternalStore } from "react";
import { CreateObjectState, CreateState } from "./CreateState";
import {
  apiOrigin,
  favLinksDataIndexed,
  linksDataIndexed,
} from "~/data/ClientDBLoader";
import { useImageState } from "./ImageState";
import { MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";
import {
  ExternalStoreProps,
  IndexedDataLastmodMH,
} from "~/data/IndexedDB/IndexedDataLastmodMH";
import {
  GetAPIFromOptions,
  linksDataOptions,
  linksFavDataOptions,
} from "~/data/DataEnv";
import { customFetch } from "../functions/fetch";
import { concatOriginUrl } from "../functions/originUrl";
import { toast } from "react-toastify";

export type LinksIndexedDBType = IndexedDataLastmodMH<
  SiteLink,
  SiteLinkData,
  MeeIndexedDBTable<SiteLink>
>;
export type LinksMapType = Map<string | number, SiteLink>;
export type LinksCategoryMapType = Map<string, SiteLink[]>;
export interface LinksStateType {
  links?: SiteLink[];
  linksMap?: LinksMapType;
  linksCategoryMap?: LinksCategoryMapType;
  linksData?: MeeIndexedDBTable<SiteLink>;
  verify(id: string | number): void;
}

function createLinksState(
  set: SetStateType<LinksStateType>,
  options: Props_LastmodMHClass_Options<SiteLink, SiteLinkData>
): LinksStateType {
  return {
    verify(id: string | number) {
      const verifyPath = GetAPIFromOptions(options, "/verify");
      set(({ linksMap }) => {
        const link = linksMap?.get(id);
        if (link?.prompt) {
          const answer = prompt(link.prompt);
          if (answer)
            customFetch(concatOriginUrl(apiOrigin, verifyPath), {
              method: "POST",
              body: { id: link.id, password: answer },
              cors: true,
            })
              .then((r) => {
                if (r.status === 200) {
                  return r.text();
                } else {
                  throw r;
                }
              })
              .then((url) => {
                toast.success("認証に成功しました", { autoClose: 1500 });
                link.url = url;
                set(({ links, linksMap, linksCategoryMap }) => ({
                  links: links?.concat(),
                  linksMap: new Map(linksMap),
                  linksCategoryMap: new Map(linksCategoryMap),
                }));
              })
              .catch((e) => {
                const r = e as Response;
                toast.error(`認証に失敗しました [${r.status}]`);
              });
        }
        return {};
      });
    },
  };
}

export const useLinks = CreateObjectState<LinksStateType>(function (set) {
  return createLinksState(set, linksDataOptions);
});
export const useFavLinks = CreateObjectState<LinksStateType>(function (set) {
  return createLinksState(set, linksFavDataOptions);
});
type imageMapType = Map<string, ImageType>;

async function callSetLinks({
  linksData,
  imagesMap,
}: {
  linksData: MeeIndexedDBTable<SiteLink>;
  imagesMap: imageMapType;
}) {
  const links = await linksData.getAll().then((list) => {
    return list
      .filter((data) => data.url || data.title || data.image)
      .map((data) => {
        if (data.image && imagesMap && imagesMap.has(data.image)) {
          data.Image = imagesMap.get(data.image)!;
        }
        return data;
      });
  });
  const linksMap: LinksMapType = new Map();
  const linksCategoryMap = links
    .filter((v) => v.key || v.url || v.title || v.image)
    .reduce<LinksCategoryMapType>((a, c) => {
      if (typeof c.id === "number") linksMap.set(c.id, c);
      if (c.key) linksMap.set(c.key, c);
      const category = c.category || "";
      if (a.has(category)) a.get(category)!.push(c);
      else a.set(category, [c]);
      return a;
    }, new Map());
  return {
    linksData,
    links,
    linksMap,
    linksCategoryMap,
  };
}
export function LinksState() {
  const { imagesMap } = useImageState();
  const { Set: setLinks } = useLinks();
  const linksData = useSyncExternalStore(
    ...ExternalStoreProps(linksDataIndexed)
  );
  useEffect(() => {
    if (linksData?.db && imagesMap) {
      callSetLinks({ imagesMap, linksData }).then((result) => {
        setLinks(result);
      });
    }
  }, [linksData, imagesMap]);
  const { Set: setFavLinks } = useFavLinks();
  const favLinksData = useSyncExternalStore(
    ...ExternalStoreProps(favLinksDataIndexed)
  );
  useEffect(() => {
    if (favLinksData?.db && imagesMap) {
      callSetLinks({ imagesMap, linksData: favLinksData }).then((result) => {
        setFavLinks(result);
      });
    }
  }, [favLinksData, imagesMap]);
  return <></>;
}
