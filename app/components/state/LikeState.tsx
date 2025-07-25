import { useEffect, useState, useSyncExternalStore } from "react";
import { CreateObjectState, CreateState } from "./CreateState";
import { MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";
import { likeDataIndexed, waitIdb } from "~/data/ClientDBLoader";
import { ExternalStoreProps } from "~/data/IndexedDB/IndexedDataLastmodMH";

export const useLikeStateUpdated = CreateState<string>();
interface LikeStateType {
  likeData?: MeeIndexedDBTable<LikeType>;
  likes?: LikeType[];
  likeMap?: Map<string, LikeType>;
  likeCategoryMap?: Map<string, Map<string, LikeType>>;
}
export const useLikeState = CreateObjectState<LikeStateType>();

export function LikeState() {
  const { Set } = useLikeState();
  const likeData = useSyncExternalStore(...ExternalStoreProps(likeDataIndexed));
  useEffect(() => {
    (async () => {
      await waitIdb;
      if (likeData?.db) {
        likeData.getAll().then((likes) => {
          const _likes = likes.filter((v) => v.path);
          const likeMap = new Map(_likes.map((v) => [v.path!, v]));
          const likeCategoryMap = _likes.reduce((map, c) => {
            let key = "general";
            let sliceStart = 0;
            let sliceEnd: number | undefined;
            if (c.path!.startsWith("?image=")) {
              key = "image";
              sliceStart = 7;
            } else if (c.path!.startsWith("/character/")) {
              key = "character";
              sliceStart = 11;
            }
            if (!map.has(key)) map.set(key, new Map());
            const childMap = map.get(key)!;
            const childKey = c.path?.slice(sliceStart, sliceEnd) || "";
            childMap.set(childKey, c);
            return map;
          }, new Map<string, Map<string, LikeType>>());
          Set({ likeData, likes, likeMap, likeCategoryMap });
        });
      }
    })();
  }, [likeData]);

  return <></>;
}
