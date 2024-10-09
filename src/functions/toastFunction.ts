import { toast } from "react-toastify";

export function CopyWithToast(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("コピーしました", { autoClose: 1500 });
}
