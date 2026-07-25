import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useEnv } from "~/components/state/EnvState";
import { redirectDataIndexed } from "~/data/ClientDBLoader";
import { CreateObjectState } from "./CreateState";
import { MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";
import { ExternalStoreProps } from "~/data/IndexedDB/IndexedDataLastmodMH";
import { useLocation, useNavigate } from "react-router";
import { convertTimeToMeeIndexedData } from "~/data/IndexedDB/ConvertToMeeIndexedData";

interface redirectState {
  redirects?: redirectType[];
  redirectsMap?: Map<string, redirectType>;
  redirectsData?: MeeIndexedDBTable<redirectIndexedDataType>;
}
export const useRedirects = CreateObjectState<redirectState>();

export default function RedirectState() {
  const { Set } = useRedirects();
  const env = useEnv()[0];
  const redirectsData = useSyncExternalStore(
    ...ExternalStoreProps(redirectDataIndexed),
  );
  useEffect(() => {
    if (redirectsData?.db && env) {
      const redirectsMap = new Map<string, redirectType>();
      redirectsData
        .getAll()
        .then((items) =>
          items.map((item) =>
            convertTimeToMeeIndexedData<redirectType>({
              item,
              convert: redirectDataIndexed.options.convert,
            }),
          ),
        )
        .then((items) => {
          items.forEach((item) => {
            if (!item.redirect) return;
            const path = item.path;
            if (!redirectsMap.has(path)) {
              redirectsMap.set(path, item);
            }
          });
          Set({
            redirectsData,
            redirectsMap,
            redirects: Array.from(redirectsMap.values()),
          });
        });
    }
  }, [redirectsData, env, Set]);
  return (
    <>
      <RedirectCheck />
    </>
  );
}

function RedirectCheck() {
  const { redirectsMap } = useRedirects();
  const { pathname, state } = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    const target = redirectsMap?.get(pathname);
    if (target) {
      const Url = new URL(location.href);
      Url.pathname = target.redirect;
      const path = Url.href.slice(Url.origin.length);
      nav(path, { state, replace: true });
    }
  }, [pathname, state]);
  return <></>;
}
