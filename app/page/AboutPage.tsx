import { CopyWithToast } from "~/components/functions/toastFunction";
import { Link, useNavigate } from "react-router";
import { BiGitBranch } from "react-icons/bi";
import {
  KeyValueEditable,
  KeyValueEditButton,
  KeyValueRenderProps,
} from "~/components/state/KeyValueDBState";
import { EnvLinksMap } from "~/Env";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "~/components/layout/Modal";
import { SetLinkPush } from "~/components/parse/MultiParser";

export default function AboutPage() {
  return (
    <div className="aboutPage">
      <h1 className="color-main en-title-font">
        <Link to="/about">About</Link>
      </h1>
      <div className="author container">
        <h2 className="color-dark">プロフィール</h2>
        <h3 className="color-main">
          <KeyValueEditable
            editEnvKey="VITE_KVDB_KEY_AUTHOR_NAME"
            editEnvDefault="AUTHOR_NAME"
          />
        </h3>
        <div className="on-en-prop">
          <h4 className="color-soft">
            <KeyValueEditable
              editEnvKey="VITE_KVDB_KEY_AUTHOR_NAME_EN"
              editEnvDefault="AUTHOR_EN_NAME"
            />
          </h4>
          <p className="color-soft">
            <KeyValueEditable
              editEnvKey="VITE_KVDB_KEY_AUTHOR_NAME_EN_PROP"
              editEnvDefault="AUTHOR_EN_PROP"
              replaceValue="[$1]"
            />
          </p>
        </div>
        <div className="body">
          <div>
            <KeyValueEditable
              editEnvKey="VITE_KVDB_KEY_AUTHOR_IMAGE"
              editEnvDefault="AUTHOR_IMAGE"
              imageMeeProps={{
                className: "authorImage",
                alt: "プロフィール画像",
              }}
              editType="image"
            />
          </div>
          <div className="description text-left">
            <KeyValueEditable
              editEnvKey="VITE_KVDB_KEY_AUTHOR_DESCRIPTION"
              editEnvDefault="AUTHOR_DESCRIPTION"
              editType="textarea"
              title="作者の詳細の編集"
            />
          </div>
        </div>
      </div>
      <AuthorHistory />
      <div className="container">
        <h3 className="color-main" id="guideline">
          <Link to="#guideline">ガイドライン</Link>
          <KeyValueEditButton
            editEnvKey="VITE_KVDB_KEY_GUIDELINE"
            editType="textarea"
          />
        </h3>
        <KeyValueRenderProps
          editEnvKey="VITE_KVDB_KEY_GUIDELINE"
          editType="textarea"
        />
      </div>
      <WebsiteFramework className="container" />
    </div>
  );
}

interface AuthorHistoryProps {
  defaultYear?: number;
  defaultCategory?: string;
}
export function AuthorHistory({
  defaultYear = NaN,
  defaultCategory = "",
}: AuthorHistoryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [yearList, setYearList] = useState<valueCountType<number>[]>([]);
  const [year, setYear] = useState<number>(defaultYear);
  const [categoriesList, setCategoriesList] = useState<valueCountType[]>([]);
  const [category, setCategory] = useState<string>(defaultCategory);
  const [modal, setModal] = useState<Node | null>(null);
  const nav = useNavigate();
  useEffect(() => {
    const elms = ref.current?.querySelectorAll<HTMLElement>("[data-year]");
    if (elms) {
      elms.forEach((e) => {
        e.hidden = false;
      });
      if (!isNaN(year)) {
        const yearStr = String(year);
        elms.forEach((e) => {
          if (e.dataset.year !== yearStr) e.hidden = true;
        });
      }
      if (category) {
        elms.forEach((e) => {
          if (e.dataset.category !== category) e.hidden = true;
        });
      }
    }
  }, [year, category]);
  useEffect(() => {
    if (modalRef.current) {
      const modalElm = modalRef.current;
      modalElm.childNodes.forEach((c) => {
        modalElm.removeChild(c);
      });
      if (modal) {
        modalElm.appendChild(modal);
      }
    }
  }, [modal]);
  return (
    <div className="history container" ref={ref}>
      <Modal
        ref={modalRef}
        isOpen={Boolean(modal)}
        onClose={() => {
          setModal(null);
        }}
      />
      <h3 className="color-main" id="history">
        <Link className="en-title-font" to="#history">
          History
        </Link>
        <KeyValueEditButton
          editEnvKey="VITE_KVDB_KEY_AUTHOR_HISTORY"
          editType="textarea"
          isFirstSelection
        />
      </h3>
      <div>
        <select
          name="year"
          title="Year filter"
          className="noBorder year"
          value={String(year)}
          onChange={(e) => {
            setYear(Number((e.target as HTMLSelectElement).value));
          }}
        >
          {yearList.map(({ value, label }, i) => (
            <option key={i} value={String(value)}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="category"
          title="Category filter"
          className="noBorder year"
          onChange={(e) => {
            setCategory((e.target as HTMLSelectElement).value);
          }}
          value={category}
        >
          {categoriesList.map(({ value, label }, i) => (
            <option key={i} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <KeyValueRenderProps
        editEnvKey="VITE_KVDB_KEY_AUTHOR_HISTORY"
        editType="textarea"
        widget={false}
        onRender={(elm) => {
          if (elm.children.length > 0) {
            const table = elm.querySelector<HTMLTableElement>("table");
            if (table) {
              const trElms = Array.from(
                table.tBodies[0]?.querySelectorAll<HTMLTableRowElement>("tr") ||
                  []
              );
              const yearMap = trElms.reduce<Map<number, number>>((m, r) => {
                const d = r.children[0] as HTMLElement;
                if (d.children.length === 0 && d.innerText) {
                  const extendAnchor = document.createElement("a");
                  extendAnchor.onclick = () => {
                    const table = document.createElement("table");
                    table.appendChild(r.cloneNode(true));
                    const ta = table.querySelectorAll("a");
                    ta.forEach((a) => {
                      SetLinkPush({ a, nav });
                    });
                    setModal(table);
                  };
                  extendAnchor.innerText = d.innerText;
                  extendAnchor.classList.add("date");
                  d.innerText = "";
                  d.appendChild(extendAnchor);
                }
                const year = Number(
                  d.innerText.slice(0, d.innerText.indexOf("/"))
                );
                r.dataset.year = String(year);
                if (m.has(year)) {
                  m.set(year, m.get(year)! + 1);
                } else {
                  m.set(year, 1);
                }
                return m;
              }, new Map());
              const yearAllCount = Array.from(yearMap.values()).reduce(
                (a, v) => a + v,
                0
              );
              const yearList: valueCountType<number>[] = [
                {
                  value: NaN,
                  count: yearAllCount,
                  label: `Year (${yearAllCount})`,
                },
              ];
              yearList.push(
                ...Array.from(yearMap.entries()).map<valueCountType<number>>(
                  ([value, count]) => ({
                    value,
                    count,
                    label: `${value} (${count})`,
                  })
                )
              );
              setYearList(yearList);
              const categoriesMap = trElms.reduce<Map<string, number>>(
                (m, r) => {
                  const d = r.children[1] as HTMLElement;
                  const category = d.innerText;
                  r.dataset.category = String(category);
                  if (m.has(category)) {
                    m.set(category, m.get(category)! + 1);
                  } else {
                    m.set(category, 1);
                  }
                  return m;
                },
                new Map()
              );
              const categoriesAllCount = Array.from(
                categoriesMap.values()
              ).reduce((a, v) => a + v, 0);
              const categoriesList: valueCountType[] = [
                {
                  value: "",
                  count: categoriesAllCount,
                  label: `Category (${categoriesAllCount})`,
                },
              ];
              categoriesList.push(
                ...Array.from(categoriesMap.entries()).map<valueCountType>(
                  ([category, count]) => ({
                    value: category,
                    count,
                    label: `${category} (${count})`,
                  })
                )
              );
              setCategoriesList(categoriesList);
            }
          }
        }}
      />
    </div>
  );
}

export function WebsiteFramework({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const githubLink = useMemo(() => EnvLinksMap.get("github"), [EnvLinksMap]);
  return (
    <div {...props}>
      <h3 className="color-main">
        このサイトの構成
        {githubLink ? (
          <a
            className="button miniIcon ml inline-flex"
            href={githubLink.url}
            title={githubLink.title || githubLink.name}
            target="_blank"
          >
            <BiGitBranch />
          </a>
        ) : null}
      </h3>
      <ul className="auto">
        <li>
          サーバー関連
          <ul>
            <li>
              <span className="label">ホスティング</span>
              <span>Cloudflare Workers</span>
            </li>
            <li>
              <span className="label">ドメイン</span>
              <span>Cloudflare Registrar</span>
            </li>
            <li>
              <span className="label">データベース</span>
              <span>Cloudflare D1</span>
            </li>
            <li>
              <span className="label">画像やファイル</span>
              <span>Cloudflare R2</span>
            </li>
          </ul>
        </li>
        <li>
          フレームワーク
          <ul>
            <li>
              <span className="label">使用言語</span>
              <span>TypeScript, SCSS</span>
            </li>
            <li>
              <span className="label">サーバー</span>
              <span>React Router v7</span>
            </li>
            <li>
              <span className="label">クライアント</span>
              <span>React Router v7</span>
            </li>
            <li>
              <span className="label">ビルダー</span>
              <span>Vite</span>
            </li>
          </ul>
        </li>
        <li>
          コンポーネント
          <ul>
            <li>
              <span className="label">アイコン</span>
              <span>react-icons</span>
            </li>
            <li>
              <span className="label">マークダウン</span>
              <span>marked</span>
            </li>
            <li>
              <span className="label">タグ選択</span>
              <span>react-select</span>
            </li>
            <li>
              <span className="label">トースト</span>
              <span>react-toastify</span>
            </li>
            <li>
              <span className="label">状態管理</span>
              <span>zustand</span>
            </li>
            <li>
              <span className="label">メタデータ</span>
              <span>mp3tag.js</span>
            </li>
            <li>
              <span className="label">UIライブラリ</span>
              <span>React-Slider</span>
            </li>
            <li>
              <span className="label">スケジュール</span>
              <span>FullCalendar</span>
            </li>
            <li>
              <span className="label">マンガ</span>
              <span>Laymic, Epub.js</span>
            </li>
          </ul>
        </li>
      </ul>
      {children}
    </div>
  );
}
