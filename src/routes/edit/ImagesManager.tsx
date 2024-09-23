import { useMemo } from "react";
import { useApiOrigin } from "@/state/EnvState";
import { GalleryManageMenuButton, GalleryObject } from "../GalleryPage";
import { useImageState } from "@/state/ImageState";
import { imageDataObject, makeImportFetchList } from "@/state/DataState";
import { MdCallMerge } from "react-icons/md";
import { PromiseOrder, PromiseOrderStateType } from "@/functions/arrayFunction";
import { toast } from "react-toastify";
import {
  toastLoadingOptions,
  toastUpdateOptions,
} from "@/components/define/toastContainerDef";

export function ImagesManager() {
  const { imageAlbums: albums } = useImageState();
  const apiOrigin = useApiOrigin()[0];
  const setLoad = imageDataObject.useLoad()[1];
  const items = useMemo(() => {
    return Object.values(Object.fromEntries(albums || []));
  }, [albums]);
  return (
    <main>
      <h2 className="color-main en-title-font">Images Manager</h2>
      <GalleryObject items={items} showInPageMenu={false} />
      <GalleryManageMenuButton>
        <button
          type="button"
          className="color round large"
          title="webpなどの画像をsrcに統一する"
          onClick={async () => {
            if (confirm("webpなどの画像をsrcに統一する処理を行いますか？")) {
              const state: PromiseOrderStateType = { abort: false };
              const id = toast.loading("srcに統一する処理を行っています", {
                ...toastLoadingOptions,
                onClose() {
                  state.abort = true;
                  toast.info("srcへの統一が中断されました");
                },
              });
              const data = imageDataObject.storage.data || [];
              const list = makeImportFetchList({
                apiOrigin,
                src: "/image/merge",
                data: data.filter((v) => v.webp || v.icon),
                partition: 50,
              });
              if (list.length > 0) {
                const state: PromiseOrderStateType = { abort: false };
                await PromiseOrder(list, {
                  interval: 50,
                  state,
                  sync(i) {
                    toast.update(id, {
                      progress: i / list.length,
                    });
                  },
                })
                  .then(() => {
                    toast.update(id, {
                      ...toastUpdateOptions,
                      render: "完了しました！",
                      type: "success",
                    });
                  })
                  .catch(() => {
                    toast.update(id, {
                      ...toastUpdateOptions,
                      render: "失敗しました",
                      type: "error",
                    });
                  })
                  .finally(() => {
                    setLoad("no-cache");
                  });
              } else {
                toast.update(id, {
                  ...toastUpdateOptions,
                  render: "更新対象がありませんでした",
                  type: "error",
                });
              }
            }
          }}
        >
          <MdCallMerge />
        </button>
      </GalleryManageMenuButton>
    </main>
  );
}
