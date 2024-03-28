import { memo, useLayoutEffect, useMemo } from "react";
import { create } from "zustand";

type FeedArticleType = {
  title: string;
  description: string;
  link: string;
  date: Date;
};

type FeedStateType = {
  title?: string;
  link?: string;
  description?: string;
  list?: FeedArticleType[];
  isSet: boolean;
  isFirst: boolean;
  set: () => void;
};

export const useFeedState = create<FeedStateType>((set) => ({
  isSet: false,
  isFirst: true,
  set: () => {
    fetch("/get/rss")
      .then((res) => {
        return res.headers.get("Content-Type")?.startsWith("application/xml")
          ? res.text()
          : "";
      })
      .then((text) => {
        if (text) {
          const p = new DOMParser();
          const dom = p.parseFromString(text, "application/xml");
          const title = dom.querySelector("title")?.textContent!;
          const link = dom.querySelector("link")?.textContent!;
          const description = dom.querySelector("description")?.textContent!;
          const articles = Array.from(
            dom.querySelectorAll("item:nth-of-type(-n+20)")
          );
          const list = articles.map((item) => {
            return {
              title: item.querySelector("title")?.textContent!,
              description: item.querySelector("description")?.textContent!,
              link: item.querySelector("link")?.textContent!,
              date: new Date(item.querySelector("pubDate")?.textContent!),
            };
          });
          set({ title, link, description, list, isSet: true, isFirst: false });
        } else set({ isFirst: false });
      });
  },
}));

export function FeedState() {
  const {} = useFeedState();
  return <></>;
}

export const FeedRead = memo(function FeedRead() {
  const { isSet, isFirst, title, link, set, list } = useFeedState();
  useLayoutEffect(() => {
    if (isFirst) set();
  }, [isFirst]);
  if (!isSet) return <></>;
  return (
    <div className="blog">
      <a className="title" href={link} title={title} target="blog">
        <h3 className="text-3xl">ノート</h3>
      </a>
      <div className="list">
        {list?.slice(0, 3).map(({ date, link, title, description }, i) => (
          <a href={link} className="article" target="note" key={i}>
            <div className="date">{date.toLocaleDateString("ja")}</div>
            <div className="title">{title || description.slice(0, 32)}</div>
          </a>
        ))}
      </div>
    </div>
  );
});
