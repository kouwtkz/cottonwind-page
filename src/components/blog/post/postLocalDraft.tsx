export const backupStorageKey = "backupPostDraft";
import { create } from "zustand";

export const useLocalDraftPost = create<{
  localDraft: Post | null;
  setLocalDraft: (post: Post | null) => void;
  removeLocalDraft: () => void;
}>((set) => ({
  localDraft: null,
  setLocalDraft: (post) => {
    set({ localDraft: post });
  },
  removeLocalDraft: () => {
    localStorage.removeItem(backupStorageKey);
    set({ localDraft: null });
  },
}));

export function getLocalDraft() {
  const itemStr = localStorage.getItem(backupStorageKey);
  if (!itemStr) return;
  const item = JSON.parse(itemStr) as any;
  item.date = item.date ? new Date(item.date) : undefined;
  item.localDraft = true;
  return item as Post;
}
