import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { create } from "zustand";
import axios from "axios";
import { GoTriangleDown, GoTriangleRight } from "react-icons/go";
const defaultUrl = "/json/gitlog.json";

type GitStateType = {
  git?: GitObjectType;
  isSet: boolean;
  url: string;
  setLog: (value: GitObjectJsonType) => void;
  setUrl: (url?: string, setFlag?: boolean) => void;
  setLogFromUrl: (url?: string) => void;
  isSetCheck: () => void;
};

export const useGitState = create<GitStateType>((set) => ({
  isSet: false,
  url: "",
  setLog: (value) => {
    const list = value.list.map((item) => {
      const [year, month, day] = item.date.split("/").map((v) => Number(v));
      return { ...item, year, month, day } as GitItemType;
    });
    const git: GitObjectType = {
      list,
      remote_url: value.remote_url,
      ymlist: YearMonthList(list),
    };
    set({ git, isSet: true });
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
        const data: GitObjectJsonType = r.data;
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

function YearMonthList(list: GitItemType[] = []) {
  const ymdic = list.reduce((a, c) => {
    let y: KeyMonthDicType;
    if (c.year in a) y = a[c.year];
    else {
      y = {};
      a[c.year] = y;
    }
    let m: GitItemType[];
    if (c.month in y) m = y[c.month];
    else {
      m = [];
      y[c.month] = m;
    }
    m.push(c);
    return a;
  }, {} as KeyYearDicType);
  const ylist: KeyYearType[] = Object.entries(ymdic).map(([key, yitem]) => {
    const mlist = {
      year: Number(key),
      value: Object.entries(yitem).map(([key, mitem]) => ({
        month: Number(key),
        value: mitem,
      })),
    };
    mlist.value.sort((a, b) => b.month - a.month);
    return mlist;
  });
  ylist.sort((a, b) => b.year - a.year);
  return ylist;
}

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

function ReadMoreTextButton({
  text,
  once,
  readMore,
  onClick,
}: {
  text: string;
  once?: boolean;
  readMore: boolean;
  onClick: (e?: any) => void;
}) {
  return (
    <div className="summary">
      <span
        tabIndex={0}
        className={"date" + (once ? " once" : "")}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.code === "Enter") onClick();
        }}
      >
        {readMore ? <GoTriangleDown /> : <GoTriangleRight />}
        <span className="text">{text}</span>
      </span>
    </div>
  );
}

function GitlogItem({ item }: { item: GitItemJsonType }) {
  const [readMore, setReadMore] = useState(false);
  const handleToggle = () => {
    setReadMore(!readMore);
  };
  return (
    <div className="item">
      <ReadMoreTextButton
        text={item.date}
        once={item.messages.length <= 1}
        readMore={readMore}
        onClick={handleToggle}
      />
      <div className="body">
        {readMore ? (
          item.messages.map((m, i) => <p key={i}>{m}</p>)
        ) : (
          <>
            <p>
              {item.messages[0]}
              {item.messages.length > 1 ? (
                <span className="readmore" onClick={handleToggle}>
                  ({"他" + (item.messages.length - 1) + "件"})
                </span>
              ) : null}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function MonthItem({
  item: { value, month },
  opened = false,
}: {
  item: KeyMonthType;
  opened?: boolean;
}) {
  const [readMore, setReadMore] = useState(opened);
  const handleToggle = () => {
    setReadMore(!readMore);
  };
  return (
    <div className={"monthItem" + (readMore ? " open" : "")}>
      <ReadMoreTextButton
        text={`${month}月`}
        readMore={readMore}
        onClick={handleToggle}
      />
      {readMore
        ? value.map((item, i) => <GitlogItem key={i} item={item} />)
        : null}
    </div>
  );
}

function YearItem({
  item: { value, year },
  opened = false,
}: {
  item: KeyYearType;
  opened?: boolean;
}) {
  const [readMore, setReadMore] = useState(opened);
  const handleToggle = () => {
    setReadMore(!readMore);
  };
  return (
    <div className="yearItem">
      <ReadMoreTextButton
        text={`${year}年`}
        readMore={readMore}
        onClick={handleToggle}
      />
      {readMore
        ? value.map((item, i) => (
            <MonthItem item={item} key={i} opened={opened && i === 0} />
          ))
        : null}
    </div>
  );
}

export function ChangeLog() {
  const { git, isSet } = useGitState();
  if (!git) return <></>;
  return (
    <div className="changeLog">
      <div className="title">
        <a href={git.remote_url} title="サイトのGithubページ" target="github">
          <h3>サイトの更新履歴</h3>
          <span>
            {git.list.length > 0 ? (
              <>
                <span>最終更新:</span>
                <span className="date">{git.list[0].date}</span>
              </>
            ) : isSet ? (
              "(データなし)"
            ) : (
              "よみこみちゅう…"
            )}
          </span>
        </a>
      </div>
      <div className="list">
        {git.ymlist.map((item, i) => (
          <YearItem item={item} key={i} opened={i === 0} />
        ))}
      </div>
    </div>
  );
}
