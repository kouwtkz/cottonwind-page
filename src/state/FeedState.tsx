import { useEffect } from "react";
import { useApiOrigin } from "./EnvState";
import { corsFetch } from "@src/functions/fetch";
import { concatOriginUrl } from "@src/functions/originUrl";
import { CreateState } from "./CreateState";

export const useOutFeed = CreateState<FeedContentType>();

export function FeedState() {
  const setOutFeed = useOutFeed()[1];
  const apiOrigin = useApiOrigin()[0];
  useEffect(() => {
    if (apiOrigin) {
      corsFetch(concatOriginUrl(apiOrigin, "/feed/get"))
        .then((res) => {
          return res.headers.get("Content-Type")?.startsWith("application/json")
            ? (res.json() as { note?: FeedContentType })
            : null;
        })
        .then((json) => {
          if (json && "note" in json) setOutFeed(json.note);
        });
    }
  }, [apiOrigin]);
  return <></>;
}

export function NoteView() {
  const outFeed = useOutFeed()[0];
  const { title, link, list } = outFeed ?? {};
  if (!outFeed) return <></>;
  return (
    <div className="blog">
      <h3>
        <a
          className="title en-title-font"
          href={link}
          title={title}
          target="blog"
        >
          Note
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
