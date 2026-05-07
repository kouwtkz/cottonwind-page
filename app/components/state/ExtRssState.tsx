import { useSyncExternalStore } from "react";
import { ExtRssSubscribe } from "~/data/ClientDBLoader";

export function useExtRss() {
  return useSyncExternalStore(
    ExtRssSubscribe.subscribe.bind(ExtRssSubscribe),
    ExtRssSubscribe.GetData.bind(ExtRssSubscribe),
    () => null,
  );
}
