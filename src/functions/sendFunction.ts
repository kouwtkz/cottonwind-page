import { toast } from "react-toastify";
import { corsFetch } from "./fetch";

interface SendDeleteProps {
  url: string;
  data: Object;
}
export async function SendDelete({ url, data }: SendDeleteProps) {
  return toast
    .promise(
      corsFetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        } as ContentTypeHeader,
        body: JSON.stringify(data),
      }).then(async (r) => {
        if (r.ok) return r;
        else throw await r.text();
      }),
      {
        pending: "削除中",
        success: "削除しました",
        error: {
          render({ data: e }) {
            return "削除に失敗しました" + (e ? `\n[${e}]` : "");
          }
        },
      }
    )
}
