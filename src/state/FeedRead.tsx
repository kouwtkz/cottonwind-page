import { memo, useLayoutEffect, useMemo } from "react";
import { create } from "zustand";

interface FeedStateType extends FeedKVType {
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
        if (json) set({ ...(json as FeedKVType), isSet: true, isBlank: false });
        else set({ isSet: true });
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
        {list?.slice(0, 3).map(({ date, link, title, description }, i) => (
          <a href={link} className="article" target="note" key={i}>
            <div className="date">
              {new Date(date).toLocaleDateString("ja")}
            </div>
            <div className="title">{title || description.slice(0, 32)}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

export function ChangeLog() {
  const { changeLog } = useFeedState();
  if (!changeLog || !changeLog.list) return <></>;
  return (
    <div className="changeLog">
      <h3>
        <a href={changeLog.url} title={changeLog.title} target="changeLog">
          サイトの更新履歴
        </a>
      </h3>
      <ul>
        {changeLog.list.slice(0, 10).map((item, i) => (
          <li key={i}>
            <span className="date">{new Date(item.created_at).toLocaleDateString("ja")}</span>
            <span className="body" dangerouslySetInnerHTML={{ __html: item.body_html }}></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
