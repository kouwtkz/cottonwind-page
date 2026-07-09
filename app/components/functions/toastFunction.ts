import { toast } from "react-toastify";

export function CopyWithToast(text: string, toastLabel?: string) {
  navigator.clipboard.writeText(text);
  toast.success(toastLabel ?? "コピーしました", { autoClose: 1500 });
}
