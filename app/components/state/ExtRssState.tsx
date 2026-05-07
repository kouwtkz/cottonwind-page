import { useSyncExternalStore } from "react";
import { ExtRssData } from "~/data/ClientDBLoader";

export function useExtRss() {
  return useSyncExternalStore(
    ExtRssData.subscribeEvent.subscribe,
    ExtRssData.GetData.bind(ExtRssData),
    () => null,
  );
}
