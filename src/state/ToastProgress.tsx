import {
  toastLoadingOptions,
  toastUpdateOptions,
} from "@/components/define/toastContainerDef";
import { useEffect } from "react";
import { Id, toast } from "react-toastify";
import { create } from "zustand";

interface Messages {
  message?: string;
  success?: string;
  autoClose?: number;
}
export const useToastProgress = create<{
  id?: Id;
  progress?: number;
  max?: number;
  message?: string;
  success?: string;
  autoClose?: number;
  setId: (id?: Id) => void;
  setMessages: (messages?: Messages) => void;
  setProgress: (progress?: number) => void;
  addProgress: () => void;
  setMax: (max?: number, messages?: Messages) => void;
  addMax: (messages?: Messages) => void;
  reset: () => void;
}>((set) => ({
  setId(id) {
    set({ id });
  },
  setMessages(messages) {
    set((state) => {
      if (!state.message && messages?.message) state.message = messages.message;
      if (!state.success && messages?.success) state.success = messages.success;
      if (!state.autoClose && messages?.autoClose)
        state.autoClose = messages.autoClose;
      return state;
    });
  },
  setProgress(progress) {
    set({ progress });
  },
  addProgress() {
    set((state) => ({ progress: (state.progress || 0) + 1 }));
  },
  setMax(max, messages) {
    set((state) => {
      if (messages) state.setMessages(messages);
      return { max };
    });
  },
  addMax(messages) {
    set((state) => {
      if (messages) state.setMessages(messages);
      return { max: (state.max || 0) + 1 };
    });
  },
  reset() {
    set({
      id: undefined,
      progress: undefined,
      max: undefined,
      message: undefined,
      success: undefined,
    });
  },
}));

export function ToastProgressState() {
  const { id, setId, progress, max, message, success, reset, autoClose } =
    useToastProgress();
  useEffect(() => {
    if (max && !id) {
      setId(toast.loading(message || "処理中", toastLoadingOptions));
    }
  }, [id, setId, message, max]);
  useEffect(() => {
    if (id && progress && max) {
      toast.update(id, {
        progress: progress / max,
      });
    }
  }, [id, progress, max]);
  useEffect(() => {
    if (id && progress === max) {
      toast.update(id!, {
        ...toastUpdateOptions,
        render: success || "処理が完了しました！",
        type: "success",
        autoClose,
      });
      reset();
    }
  }, [id, progress, max, reset, success, autoClose]);
  return <></>;
}
