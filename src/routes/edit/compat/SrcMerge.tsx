import {
  toastLoadingOptions,
  toastUpdateOptions,
} from "@/components/define/toastContainerDef";
import { PromiseOrder, PromiseOrderStateType } from "@/functions/arrayFunction";
import { imageDataObject, makeImportFetchList } from "@/state/DataState";
import { toast } from "react-toastify";

export type compat_v1_ImageDataType = ImageDataType & {
  webp?: string | null;
  icon?: string | null;
};
export async function CompatSrcMerge({
  apiOrigin,
  data = imageDataObject.storage.data || [],
  doneClose,
}: {
  apiOrigin?: string;
  data?: compat_v1_ImageDataType[];
  doneClose?: number;
}) {
  const state: PromiseOrderStateType = { abort: false };
  const id = toast.loading("srcに統一する処理を行っています", {
    ...toastLoadingOptions,
    onClose() {
      state.abort = true;
      toast.info("srcへの統一が中断されました");
    },
  });
  const list = makeImportFetchList({
    apiOrigin,
    src: "/image/compat/merge",
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
          autoClose: doneClose,
        });
      })
      .catch(() => {
        toast.update(id, {
          ...toastUpdateOptions,
          render: "失敗しました",
          type: "error",
          autoClose: doneClose,
        });
      });
  } else {
    toast.update(id, {
      ...toastUpdateOptions,
      render: "srcへ変換する項目がありませんでした",
      type: "info",
      autoClose: doneClose,
    });
  }
}
