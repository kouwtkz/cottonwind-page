import { useEffect, useMemo, useState } from "react";
import { GoTriangleDown, GoTriangleRight } from "react-icons/go";
import { CreateObjectState } from "./CreateState";
const defaultUrl = "/json/gitlog.json";

type GitStateType = {
  git?: GitObjectType;
  isSet: boolean;
  setLog: (value: GitObjectJsonType) => void;
};

export const useGitState = CreateObjectState<GitStateType>((set) => ({
  isSet: false,
  setLog: (value) => {
    value.list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastUpdate = value.list[0].date;
    const list = value.list.map((item) => {
      const [year, month, day] = item.date.split("/").map((v) => Number(v));
      return { ...item, year, month, day } as GitItemType;
    });
    const git: GitObjectType = {
      remote_url: value.remote_url,
      list,
      lastUpdate,
      ymlist: YearMonthList(list),
    };
    set({ git, isSet: true });
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

export default function GitState({ url = defaultUrl }: { url?: string }) {
  const { isSet, setLog } = useGitState();
  useEffect(() => {
    if (!isSet) {
      fetch(url)
        .then<GitObjectJsonType>((r) => r.json())
        .then((data) => {
          setLog(data);
        });
    }
  }, []);
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
        className={"date cursor-pointer" + (once ? " once" : "")}
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
  const monthDateCount = useMemo(
    () => value.reduce((a, c) => a + c.messages.length, 1),
    [value]
  );
  return (
    <div className={"monthItem" + (readMore ? " open" : "")}>
      <ReadMoreTextButton
        text={`${month}月 (${monthDateCount}件)`}
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
  const { git } = useGitState();
  return (
    <div className="aboutPage changeLog">
      <GitState />
      {git ? (
        <>
          <div className="title">
            <a
              href={git.remote_url}
              title="サイトのGithubページ"
              target="github"
            >
              <h3>サイトの更新履歴</h3>
              <span>
                {git.list.length > 0 ? (
                  <>
                    <span>最終更新:</span>
                    <span className="date cursor-pointer">
                      {git.lastUpdate}
                    </span>
                  </>
                ) : (
                  "(データなし)"
                )}
              </span>
            </a>
          </div>
          <div className="list">
            {git.ymlist.map((item, i) => (
              <YearItem item={item} key={i} opened={i === 0} />
            ))}
          </div>
        </>
      ) : (
        <>
          <span>よみこみちゅう…</span>
        </>
      )}
    </div>
  );
}
