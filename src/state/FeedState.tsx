import { useLayoutEffect } from "react";
import { create } from "zustand";
import { GitDetails } from "./GitState";

interface FeedStateType extends FeedContentsType {
  isSet: boolean;
  isBlank: boolean;
  set: (limit?: number) => void;
}

export const useFeedState = create<FeedStateType>((set) => ({
  isSet: false,
  isBlank: true,
  set: (limit = 3) => {
    fetch("/get/feed")
      .then((res) => {
        return res.headers.get("Content-Type")?.startsWith("application/json")
          ? res.json()
          : null;
      })
      .then((json) => {
        if (json) {
          const { note } = json as FeedContentsType;
          set({ note, isSet: true, isBlank: false });
        } else set({ isSet: true });
      });
  },
}));

export function FeedState() {
  const { isSet, set } = useFeedState();
  useLayoutEffect(() => {
    if (!isSet) set();
  }, [isSet]);
  return <></>;
}

export function NoteView() {
  const { isBlank, note } = useFeedState();
  const { title, link, list } = note ?? {};
  if (isBlank) return <></>;
  return (
    <div className="blog">
      <h3>
        <a className="title" href={link} title={title} target="blog">
          NOTE
        </a>
      </h3>
      <div className="list">
        {list?.slice(0, 3).map(({ date, link, title }, i) => (
          <a href={link} className="article" target="note" key={i}>
            <div className="date">
              {new Date(date).toLocaleDateString("ja")}
            </div>
            <div className="title">{title.slice(0, 32)}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
