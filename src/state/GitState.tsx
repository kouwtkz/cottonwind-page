import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { create } from "zustand";
import axios from "axios";
import { GoTriangleDown, GoTriangleRight } from "react-icons/go";
const defaultUrl = "/json/gitlog.json";

type GitStateType = {
  git?: GitObjectType;
  isSet: boolean;
  url: string;
  setLog: (value: GitObjectType) => void;
  setUrl: (url?: string, setFlag?: boolean) => void;
  setLogFromUrl: (url?: string) => void;
  isSetCheck: () => void;
};

export const useGitState = create<GitStateType>((set) => ({
  isSet: false,
  url: "",
  setLog: (value) => {
    set({ git: value, isSet: true });
  },
  setUrl(url, setFlag = true) {
    if (setFlag) {
      set((state) => {
        state.setLogFromUrl(url);
        return state;
      });
    } else {
      set(() => {
        return { url };
      });
    }
  },
  setLogFromUrl(url?: string) {
    set((state) => {
      axios(url || state.url).then((r) => {
        const data: GitObjectType = r.data;
        state.setLog(data);
      });
      return url ? { url } : state;
    });
  },
  isSetCheck() {
    set((state) => {
      if (!state.isSet) state.setLogFromUrl();
      return state;
    });
  },
}));

export default function GitState({
  url = defaultUrl,
  setFlag,
}: {
  url?: string;
  setFlag?: boolean;
}) {
  const { setUrl } = useGitState();
  const isSet = useRef(false);
  useEffect(() => {
    if (!isSet.current) {
      setUrl(url, setFlag);
      isSet.current = true;
    }
  });
  return <></>;
}

function GitlogItem({ item }: { item: GitItemType }) {
  const [readMore, setReadMore] = useState(false);
  const handleToggle = () => {
    setReadMore(!readMore);
  };
  return (
    <>
      <div>
        <span
          tabIndex={0}
          className="date cursor-pointer inline-flex items-center"
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (e.code === "Enter") handleToggle();
          }}
        >
          {readMore ? <GoTriangleDown /> : <GoTriangleRight />}
          <span>{item.date}</span>
        </span>
      </div>
      <div className="body flex-1">
        {readMore ? (
          item.messages.map((m, i) => <p key={i}>{m}</p>)
        ) : (
          <>
            <p>
              {item.messages[0]}
              {item.messages.length > 1 ? (
                <span
                  className="readmore"
                  onClick={handleToggle}
                >
                  ({"他" + (item.messages.length - 1) + "件"})
                </span>
              ) : null}
            </p>
          </>
        )}
      </div>
    </>
  );
}

export function ChangeLog() {
  const { git, isSet } = useGitState();
  if (!git) return <></>;
  const log = git.list ?? [];
  return (
    <div className="changeLog">
      <div className="title">
        <a href={git.remote_url} title="サイトのGithubページ" target="github">
          <h3>サイトの更新履歴</h3>
          <span>
            {log.length > 0 ? (
              <>
                <span>最終更新:</span>
                <span className="date">{log[0].date}</span>
              </>
            ) : isSet ? (
              "(データなし)"
            ) : (
              "よみこみちゅう…"
            )}
          </span>
        </a>
      </div>
      <ul>
        {log.map((item, i) => (
          <li key={i}>
            <GitlogItem item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}
