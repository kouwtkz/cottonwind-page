import { useSyncExternalStore } from "react";
import { getSnapshotExtRss } from "~/data/ClientDBLoader";

export function useExtRss() {
  return useSyncExternalStore(
    () => {
      return () => null;
    },
    () => getSnapshotExtRss(),
    () => null,
  );
}
