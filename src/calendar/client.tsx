import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  NavigateOptions,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import "@/components/hook/ScrollLock";
import { ClickEffect } from "@/components/click/ClickEffect";
import { ClickEventState } from "@/components/click/useClickEvent";
import { Theme } from "@/components/theme/Theme";
import {
  CalendarMee,
  CalendarMeeState,
  FC_SP_EVENT_ID,
  FC_VIEW_MONTH,
  NOTICE_KEY_COUNTDOWN,
  Type_VIEW_FC,
  useCalendarMee,
} from "./CalendarMee";
import { CreateObjectState, CreateState } from "@/state/CreateState";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldValues, useForm } from "react-hook-form";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { Modal } from "@/layout/Modal";
import { FormatDate, ToFormTime } from "@/functions/DateFunction";
import { EventClickArg } from "@fullcalendar/core/index.js";
import { toast, ToastContainer } from "react-toastify";
import {
  defaultToastContainerOptions,
  toastLoadingShortOptions,
} from "@/components/define/toastContainerDef";
import { ToastProgressState } from "@/state/ToastProgress";
import {
  RiEdit2Fill,
  RiNotification2Fill,
  RiNotification2Line,
} from "react-icons/ri";
import { SiteMenuSwitchButtons } from "@/layout/SiteMenu";
import { useNotification } from "@/components/worker/notification/NotificationState";
import { fileDialog, fileDownload } from "@/components/FileTool";
import { getUUID } from "@/functions/clientFunction";
import { MeeIndexedDB } from "@/data/IndexedDB/MeeIndexedDB";
import {
  IndexedDataClass,
  IndexedKVClass,
} from "@/data/IndexedDB/MeeIndexedDataClass";
import { useHotkeys } from "react-hotkeys-hook";
import { SwState } from "@/components/worker/serviceWorker/clientSwState";
import { DOMContentLoaded } from "@/clientScripts";

const DEFAULT_VIEW: Type_VIEW_FC = FC_VIEW_MONTH;

const tableName = "calendarAppData";

const DEFAULT_VIEW_KVKEY = "defaultView";
const GOOGLE_API_KEY_KVKEY = "googleApiKey";
type CALENDAR_APP_KVKEYS =
  | typeof DEFAULT_VIEW_KVKEY
  | typeof GOOGLE_API_KEY_KVKEY;

class IndexedCalendarMHEvents extends IndexedDataClass<EventsDataType> {
  saveFromJSON(props: Props_IndexedDataClass_NoCallback_Save<EventsDataType>) {
    return super.save({
      ...props,
      callback(item) {
        item.start = new Date(item.start);
        item.end = new Date(item.end);
        return item;
      },
    });
  }
}
const INDEXED_EVENTS_NAME = "local-events";
const indexedCalendarEvents = new IndexedCalendarMHEvents({
  name: INDEXED_EVENTS_NAME,
  primary: "id",
  secondary: ["start"],
});
class IndexedCalendarMH_KV extends IndexedKVClass<
  string | null,
  CALENDAR_APP_KVKEYS
> {
  saveFromJSON({
    data,
    store,
  }: Props_IndexedDataClass_DataStore<CalendarAppClassType>) {
    const kvMap = new Map();
    if (data.defaultView) kvMap.set(DEFAULT_VIEW_KVKEY, data.defaultView);
    if (data.googleApiKey) kvMap.set(GOOGLE_API_KEY_KVKEY, data.googleApiKey);
    return super.save({ store, data: kvMap });
  }
}
const INDEXED_KV_NAME = "kv";
const indexedCalendarKV = new IndexedCalendarMH_KV({ name: INDEXED_KV_NAME });
const INDEXED_CID_NAME = "calendarID";
const indexedCalendarID = new IndexedDataClass<CalendarIdListType>({
  name: INDEXED_CID_NAME,
  primary: "key",
});

async function ExportData() {
  const exportData: CalendarAppClassType = {};
  exportData.events = await indexedCalendarEvents.table.getAll();
  const kv = await indexedCalendarKV.getAllMap();
  if (kv.has("defaultView")) exportData.defaultView = kv.get("defaultView");
  if (kv.has("googleApiKey")) exportData.googleApiKey = kv.get("googleApiKey");
  exportData.googleCalendarId = await indexedCalendarID.table.getAll();
  return exportData;
}
async function ImportData(json: string) {
  const data: CalendarAppClassType = JSON.parse(json);
  if (data.events)
    await indexedCalendarEvents.saveFromJSON({ data: data.events });
  await indexedCalendarKV.saveFromJSON({ data });
  if (data.googleCalendarId) {
    const list = data.googleCalendarId.map((item, i) => {
      if (typeof item === "string") return { key: i + 1, id: item };
      else return item;
    });
    await indexedCalendarID.save({ data: list });
  }
  localStorage.removeItem("calendarAppData");
}

type INDEXED_NAME_UNION =
  | typeof INDEXED_EVENTS_NAME
  | typeof INDEXED_KV_NAME
  | typeof INDEXED_CID_NAME;

export let dbCalendarClass: MeeIndexedDB | undefined;

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },
]);

export const dbCalendarCreatePromise = MeeIndexedDB.create({
  version: 1,
  dbName: "cottonwind-data-calendar",
  async onupgradeneeded(e, db) {
    await indexedCalendarEvents.dbUpgradeneeded(e, db);
    await indexedCalendarID.dbUpgradeneeded(e, db);
    await indexedCalendarKV.dbUpgradeneeded(e, db);
  },
  async onsuccess(db) {
    await indexedCalendarEvents.dbSuccess(db);
    await indexedCalendarID.dbSuccess(db);
    await indexedCalendarKV.dbSuccess(db);
  },
}).then(async (db) => {
  dbCalendarClass = db;
  {
    const localItem = localStorage.getItem("calendarAppData");
    if (localItem) {
      await ImportData(localItem);
      localStorage.removeItem("calendarAppData");
    }
  }
  return db;
});

DOMContentLoaded(() => {
  dbCalendarCreatePromise.finally(() => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <>
        <ClickEffect />
        <ClickEventState />
        <Theme />
        <ToastContainer {...defaultToastContainerOptions} />
        <ToastProgressState />
        <RouterProvider router={router} />
      </>
    );
  });
});

function ToEventMap(events: EventsDataType[]) {
  return new Map(events.map<[string, EventsDataType]>((v) => [v.id, v]));
}

interface CalendarAppState extends CalendarAppStateType {
  IndexedSetupMap: Map<INDEXED_NAME_UNION, boolean>;
}
export const useCalendarAppState = CreateObjectState<CalendarAppState>(
  (set) => ({
    googleApiKey: null,
    defaultView: DEFAULT_VIEW,
    eventsMap: new Map(),
    IndexedSetupMap: new Map(
      [INDEXED_EVENTS_NAME, INDEXED_KV_NAME, INDEXED_CID_NAME].map((name) => [
        name as INDEXED_NAME_UNION,
        false,
      ])
    ),
    async save({
      event,
      events: _events,
      googleApiKey,
      googleCalendarId,
      overwrite,
      defaultView,
    }: CalendarAppStateSaveProps = {}) {
      if (overwrite) {
        if (typeof event !== "undefined" || typeof _events !== "undefined") {
          await indexedCalendarEvents.table.clear();
        }
        if (
          typeof googleApiKey !== "undefined" ||
          typeof googleCalendarId !== "undefined"
        ) {
          await indexedCalendarKV.table.clear();
        }
        if (typeof defaultView !== "undefined") {
          await indexedCalendarID.table.clear();
        }
      }
      let indexedCalendarKVMap = new Map<CALENDAR_APP_KVKEYS, any>();
      if (typeof googleApiKey !== "undefined") {
        indexedCalendarKVMap.set("googleApiKey", googleApiKey);
      }
      if (typeof defaultView !== "undefined") {
        indexedCalendarKVMap.set("defaultView", defaultView);
        set({ defaultView });
      }
      if (indexedCalendarKVMap.size) {
        await indexedCalendarKV.save({ data: indexedCalendarKVMap });
      }
      const events: Array<Partial<EventsDataType>> = _events || [];
      if (event) events.unshift(event);
      if (events.length) {
        await indexedCalendarEvents.save({ data: events });
      }
      await Promise.all(
        events.map(async (event) => {
          return indexedCalendarEvents.table.usingUpdate({
            query: event.id!,
            callback(item) {
              if (item) {
                return { ...item, ...event };
              } else {
                return event as EventsDataType;
              }
            },
          });
        })
      );
      if (googleCalendarId) {
        await indexedCalendarID.save({
          data: Array.isArray(googleCalendarId)
            ? googleCalendarId
            : [googleCalendarId],
        });
      }
    },
    removeEvent(id) {
      set((state) => {
        state.eventsMap.delete(id);
        state.save({ eventsMap: state.eventsMap });
        return {};
      });
    },
  })
);

function checkIndexedMap(
  IndexedSetupMap: Map<INDEXED_NAME_UNION, boolean>,
  name: INDEXED_NAME_UNION
) {
  if (!IndexedSetupMap.get(name)) {
    IndexedSetupMap.set(name, true);
    IndexedSetupMap = new Map(IndexedSetupMap);
  }
  return IndexedSetupMap;
}

function Root() {
  const { events, googleApiKey, googleCalendarId, Set, IndexedSetupMap } =
    useCalendarAppState();
  const { setLoading } = useCalendarMee();
  const { state } = useLocation();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const setOpenSearchParamFunction = useCallback(
    (key: "edit", value: boolean | string) => {
      const options = openSearchParamFunction({
        key,
        searchParams,
        state,
        value,
      });
      if (typeof options === "number") nav(options);
      else setSearchParams(...options);
    },
    [state, searchParams]
  );
  const complete = useMemo(() => {
    return Array.from(IndexedSetupMap.values()).every((v) => v);
  }, [IndexedSetupMap]);
  useEffect(() => {
    if (complete) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [complete]);
  const indexedEvents = useSyncExternalStore(
    indexedCalendarEvents.subscribe,
    () => indexedCalendarEvents.table
  );
  const indexedKV = useSyncExternalStore(
    indexedCalendarKV.subscribe,
    () => indexedCalendarKV.table
  );
  const indexedGgID = useSyncExternalStore(
    indexedCalendarID.subscribe,
    () => indexedCalendarID.table
  );

  useEffect(() => {
    indexedEvents.getAll().then((events) => {
      Set(({ IndexedSetupMap }) => {
        IndexedSetupMap = checkIndexedMap(
          IndexedSetupMap,
          indexedEvents.options.name as INDEXED_NAME_UNION
        );
        return {
          events,
          eventsMap: new Map(events?.map((v) => [v.id, v])),
          IndexedSetupMap,
        };
      });
    });
  }, [indexedEvents]);
  useEffect(() => {
    indexedKV.getAllMap<CALENDAR_APP_KVKEYS>().then((kv) => {
      Set(({ IndexedSetupMap }) => {
        IndexedSetupMap = checkIndexedMap(
          IndexedSetupMap,
          indexedKV.options.name as INDEXED_NAME_UNION
        );
        return {
          googleApiKey: kv.get("googleApiKey")?.value,
          defaultView: kv.get("defaultView")?.value,
          IndexedSetupMap,
        };
      });
    });
  }, [indexedKV]);
  useEffect(() => {
    indexedGgID.getAll().then((googleCalendarId) => {
      Set(({ IndexedSetupMap }) => {
        IndexedSetupMap = checkIndexedMap(
          IndexedSetupMap,
          indexedGgID.options.name as INDEXED_NAME_UNION
        );
        return { googleCalendarId, IndexedSetupMap };
      });
    });
  }, [indexedGgID]);

  useEffect(() => {
    document.querySelector("html")?.classList.remove("loading");
  }, []);
  const EditButton = useCallback(
    ({ event }: CalendarMeeEventSubComponentProps) => {
      if (event.raw) return null;
      else
        return (
          <button
            type="button"
            title="編集"
            onClick={() => {
              setOpenSearchParamFunction("edit", true);
            }}
          >
            <RiEdit2Fill />
          </button>
        );
    },
    [state, searchParams]
  );
  return (
    <>
      <div className="calendar-app">
        <CalendarMeeState
          defaultEvents={events}
          googleApiKey={googleApiKey}
          defaultCalendarList={googleCalendarId}
          RightBottomComponent={EditButton}
        />
        <SwState />
        <Outlet />
      </div>
    </>
  );
}

interface openSearchParamFunctionProps {
  searchParams: URLSearchParams;
  key: string;
  value?: any;
  state?: any;
  whenEnabled?: string;
}
function openSearchParamFunction({
  key,
  value,
  searchParams,
  state,
}: openSearchParamFunctionProps): [URLSearchParams, NavigateOptions] | number {
  if (value) {
    let whenEnabled = "enable";
    if (typeof value !== "boolean") whenEnabled = String(value);
    searchParams.set(key, whenEnabled);
    state = {
      ...(state && typeof state === "object" ? state : {}),
      from: location.href,
    };
    return [searchParams, { state, preventScrollReset: true }];
  } else {
    if (state && typeof state === "object" && "from" in state) {
      return -1;
    } else {
      searchParams.delete(key);
      if (state && typeof state === "object") delete state.from;
      return [searchParams, { state, replace: true, preventScrollReset: true }];
    }
  }
}

const calendarAppEventEditSchema = z.object({});
function CalendarAppEventEdit() {
  const { events, eventsMap, save, removeEvent } = useCalendarAppState();
  const { state } = useLocation();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const setOpenSearchParamFunction = useCallback(
    (key: "edit", value: boolean | string) => {
      const options = openSearchParamFunction({
        key,
        searchParams,
        state,
        value,
      });
      if (typeof options === "number") nav(options);
      else setSearchParams(...options);
    },
    [state, searchParams]
  );
  const paramEdit = useMemo(() => searchParams.get("edit"), [searchParams]);
  const paramEventId = useMemo(
    () => searchParams.get(FC_SP_EVENT_ID),
    [searchParams]
  );
  const stateEdit = useMemo<EventsDataType | null>(() => {
    if (paramEdit) {
      if (paramEventId) {
        return eventsMap.get(paramEventId) || null;
      } else {
        const date = new Date(paramEdit);
        const newDate = date ? new Date(date) : new Date();
        newDate.setMilliseconds(0);
        newDate.setSeconds(0);
        const start = new Date(newDate);
        start.setMinutes(0);
        start.setHours(start.getHours() + 1);
        const end = new Date(start);
        end.setHours(end.getHours() + 1);
        return {
          id: getUUID(),
          start,
          end,
        };
      }
    } else return null;
  }, [paramEdit, paramEventId, eventsMap]);

  const { reload } = useCalendarMee();
  const isOpenForm = useMemo(() => Boolean(stateEdit), [stateEdit]);
  const keepEdit = useRef<EventsDataType | null>(null);
  const edit = useMemo(() => {
    if (stateEdit && isOpenForm) {
      keepEdit.current = stateEdit;
    } else if (keepEdit.current) {
      const edit = keepEdit.current;
      keepEdit.current = null;
      return edit;
    }
    return stateEdit;
  }, [stateEdit]);
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    watch,
    setValue,
    formState: { isDirty, dirtyFields, errors, defaultValues },
  } = useForm<FieldValues>({
    values: {
      title: edit?.title || "",
      description: edit?.description || "",
      start: ToFormTime(edit?.start),
      end: ToFormTime(edit?.end),
      allDay: edit?.allDay || false,
      location: edit?.location || "",
    },
    resolver: zodResolver(calendarAppEventEditSchema),
  });
  useEffect(() => {
    if (!isOpenForm) reset();
  }, [isOpenForm]);
  const foundIndex = useMemo(
    () =>
      edit && events ? events.findIndex((event) => event.id === edit.id) : -1,
    [edit, events]
  );
  const Done = useCallback(
    ({
      entry,
      eventClose,
      eventsOverwrite,
    }: {
      entry?: Partial<EventsDataType>;
      eventClose?: boolean;
      eventsOverwrite?: boolean;
    } = {}) => {
      reload({
        start: entry?.start,
        end: entry?.end,
        eventsOverwrite,
        eventClose,
      });
      setOpenSearchParamFunction("edit", false);
    },
    [searchParams, state]
  );
  const watchStartDate = watch("start");
  const watchEndDate = watch("end");
  const duringDiffDate = useMemo(() => {
    const startValue = getValues("start");
    if (startValue && watchEndDate) {
      const startDate = new Date(startValue);
      const endDate = new Date(watchEndDate);
      return endDate.getTime() - startDate.getTime();
    } else return 0;
  }, [watchEndDate]);
  useEffect(() => {
    if (watchStartDate) {
      const startDate = new Date(watchStartDate);
      let endDate: Date;
      if (watchEndDate) {
        endDate = new Date(watchEndDate);
        endDate.setTime(startDate.getTime() + duringDiffDate);
      } else {
        endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);
      }
      setValue("end", ToFormTime(endDate), { shouldDirty: true });
    }
  }, [watchStartDate, duringDiffDate]);
  useEffect(() => {
    if (watchEndDate) {
      const startValue = getValues("start");
      if (startValue) {
        const startDate = new Date(startValue);
        const startTime = startDate.getTime();
        const endDate = new Date(watchEndDate);
        const endTime = endDate.getTime();
        if (startTime > endTime) {
          endDate.setTime(startTime);
          setValue("end", ToFormTime(endDate), {
            shouldDirty: true,
          });
        }
      }
    }
  }, [watchEndDate]);
  const Submit = useCallback(() => {
    if (edit && isDirty) {
      const values = getValues();
      const entry: Partial<EventsDataType> = edit;
      Object.entries(values).forEach(([k, v]) => {
        switch (k) {
          case "start":
          case "end":
            entry[k] = new Date(v);
            break;
          default:
            (entry as any)[k] = v;
            break;
        }
      });
      save({ event: entry });
      Done({ entry });
    }
  }, [events, isDirty, edit, foundIndex]);
  const Reset = useCallback(() => {
    reset();
  }, []);
  const deletable = useMemo(() => foundIndex >= 0, [foundIndex]);
  const Delete = useCallback(() => {
    if (edit && deletable && confirm("本当に削除しますか？")) {
      removeEvent(edit.id);
      Done({ eventClose: true, eventsOverwrite: true });
    }
  }, [events, deletable]);
  useHotkeys("ctrl+enter", Submit, { enableOnFormTags: true });
  return (
    <Modal
      className="calendarAppEdit"
      isOpen={isOpenForm}
      onClose={() => {
        if (!isDirty || confirm("編集中ですが編集画面から離脱しますか？")) {
          setOpenSearchParamFunction("edit", false);
        }
      }}
      timeout={60}
    >
      <form className="flex" onSubmit={handleSubmit(Submit)}>
        <input title="タイトル" placeholder="タイトル" {...register("title")} />
        <input
          type="datetime-local"
          step={60}
          title="開始"
          {...register("start")}
        />
        <input
          type="datetime-local"
          step={60}
          title="終了"
          {...register("end")}
        />
        <label>
          終日
          <input title="終日" type="checkbox" {...register("allDay")} />
        </label>
        <input
          title="場所"
          placeholder="場所の情報"
          {...register("location")}
        />
        <textarea
          title="詳細"
          placeholder="詳細"
          {...register("description")}
        />
        <div className="actions">
          <button
            type="button"
            className="color-warm"
            onClick={Delete}
            disabled={!deletable}
          >
            削除
          </button>
          <button
            type="button"
            className="color"
            onClick={Reset}
            disabled={!isDirty}
          >
            リセット
          </button>
          <button
            type="submit"
            className="color"
            onClick={handleSubmit(Submit, (e) => {
              console.log(e);
            })}
            disabled={!isDirty}
          >
            保存
          </button>
        </div>
      </form>
    </Modal>
  );
}

const googleCalendarSchema = z.object({
  googleApiKey: z.string(),
  googleCalendarId_1: z.string(),
  googleCalendarId_2: z.string(),
  googleCalendarId_3: z.string(),
  googleCalendarId_4: z.string(),
});
function CalendarSettingForm() {
  const { googleApiKey, googleCalendarId, events, save, defaultView, Set } =
    useCalendarAppState();
  const { reload, view, date } = useCalendarMee();
  const { state } = useLocation();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const setOpenSearchParamFunction = useCallback(
    (key: "setting", value: boolean) => {
      const options = openSearchParamFunction({
        key,
        searchParams,
        state,
        value,
      });
      if (typeof options === "number") nav(options);
      else setSearchParams(...options);
    },
    [state, searchParams]
  );
  const isOpenForm = useMemo(() => {
    return searchParams.has("setting");
  }, [searchParams]);
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { isDirty, dirtyFields, errors },
  } = useForm<FieldValues>({
    values: {
      googleApiKey: googleApiKey || "",
      googleCalendarId_1: googleCalendarId?.[0]?.id || "",
      googleCalendarId_2: googleCalendarId?.[1]?.id || "",
      googleCalendarId_3: googleCalendarId?.[2]?.id || "",
      googleCalendarId_4: googleCalendarId?.[3]?.id || "",
    },
    resolver: zodResolver(googleCalendarSchema),
  });
  const Submit = useCallback(() => {
    if (isDirty) {
      const options: CalendarAppStateSaveProps = {};
      const valuesMap = new Map(Object.entries(getValues()));
      if (valuesMap.has("googleApiKey"))
        options.googleApiKey = valuesMap.get("googleApiKey") || null;
      const valuesGoogleCalendarIdList = Array.from(valuesMap.entries()).filter(
        ([k, v]) => k.startsWith("googleCalendarId") && typeof v !== "undefined"
      );
      if (valuesGoogleCalendarIdList.length > 0) {
        const googleCalendarId: CalendarIdListType[] = [];
        options.googleCalendarId = googleCalendarId;
        valuesGoogleCalendarIdList.forEach(([k, v]) => {
          if (typeof v !== "undefined") {
            const numMatch = k.match(/\d+$/);
            if (numMatch) {
              googleCalendarId.push({
                key: Number(numMatch[0]),
                id: v,
              });
            }
          }
        });
      }
      save(options);
      reload({ syncOverwrite: true });
      setOpenSearchParamFunction("setting", false);
    }
  }, [googleApiKey, googleCalendarId, events, isDirty]);
  useEffect(() => {
    if (!isOpenForm) reset();
  }, [isOpenForm]);
  const SetDefaultView = useCallback(() => {
    const isDefault = (defaultView || DEFAULT_VIEW) === view;
    return (
      <div className="actions">
        <button
          type="button"
          disabled={isDefault}
          onClick={() => {
            save({ defaultView: view }).then(() => {
              nav(-1);
              setTimeout(() => {
                setSearchParams(
                  (search) => {
                    search.delete("fc-view");
                    return search;
                  },
                  { replace: true }
                );
                setTimeout(() => {
                  location.reload();
                }, 0);
              }, 10);
            });
          }}
        >
          {isDefault ? (
            <div>
              <span>現在のビューは</span>
              <span>デフォルトです</span>
            </div>
          ) : (
            <div>
              <span>現在のビューを</span>
              <span>デフォルトにする</span>
            </div>
          )}
        </button>
      </div>
    );
  }, [defaultView, view]);
  const { isEnable: _iENC, keyValues, setNotification } = useNotification();
  const countdownNotification = useMemo(
    () => _iENC && Boolean(keyValues?.[NOTICE_KEY_COUNTDOWN]),
    [_iENC, keyValues]
  );
  const SetNotification = useCallback(() => {
    return (
      <>
        <button
          type="button"
          className="labels"
          onClick={() => {
            setNotification(NOTICE_KEY_COUNTDOWN, !countdownNotification);
          }}
        >
          {countdownNotification ? (
            <>
              <RiNotification2Fill />
              <div>
                <span>カウントダウンの</span>
                <span>通知を</span>
                <span>解除する</span>
              </div>
            </>
          ) : (
            <>
              <RiNotification2Line />
              <div>
                <span>カウントダウンの</span>
                <span>通知を</span>
                <span>有効にする</span>
              </div>
            </>
          )}
        </button>
      </>
    );
  }, [countdownNotification]);
  return (
    <Modal
      className="calendarAppEdit"
      isOpen={isOpenForm}
      onClose={() => {
        if (!isDirty || confirm("編集中ですが編集画面から離脱しますか？")) {
          setOpenSearchParamFunction("setting", false);
        }
      }}
      timeout={60}
      scroll
    >
      <form onSubmit={handleSubmit(Submit)}>
        <h2>テーマの設定</h2>
        <SiteMenuSwitchButtons />
        <h2>カレンダーの設定</h2>
        <SetDefaultView />
        <SetNotification />
        <h2>データ管理</h2>
        <div className="actions">
          <button
            type="submit"
            onClick={() => {
              ExportData();
              if (confirm("JSONファイルでエクスポートしますか？")) {
                ExportData().then((data) => {
                  fileDownload(
                    `calendar_${FormatDate(new Date(), "Ymd_his")}.json`,
                    JSON.stringify(data)
                  );
                });
              }
            }}
          >
            エクスポート
          </button>
          <button
            type="submit"
            onClick={() => {
              fileDialog("application/json")
                .then((e) => {
                  return e.item(0)?.text();
                })
                .then((text) => {
                  if (text) {
                    ImportData(text);
                    const data = {};
                    Set(data);
                    reload({
                      start: date,
                      end: date,
                      eventsOverwrite: true,
                    });
                    const eventCount = 0;
                    toast(
                      (eventCount ? `${eventCount}件` : "") +
                        "上書きインポートしました",
                      toastLoadingShortOptions
                    );
                  }
                });
            }}
          >
            インポート
          </button>
        </div>
        <details>
          <summary>GoogleAPIの設定（読取専用・任意）</summary>
          <ul>
            <li>
              <label className="flex">
                <span className="label-l">Google API</span>
                <input
                  title="Google API Key"
                  placeholder="Google API Key"
                  className="flex-1"
                  {...register("googleApiKey")}
                />
              </label>
            </li>
            <p>GoogleカレンダーIDの設定</p>
            {[1, 2, 3, 4].map((i) => (
              <li key={i}>
                <label className="flex">
                  <span className="label-l">{i}つめのID</span>
                  <input
                    title={`Google Calendar ID (${i})`}
                    placeholder={`Google Calendar ID (${i})`}
                    className="flex-1"
                    {...register(`googleCalendarId_${i}`)}
                  />
                </label>
              </li>
            ))}
          </ul>
        </details>
        <div className="actions">
          <button
            type="submit"
            onClick={handleSubmit(Submit, (e) => {
              console.log(e);
            })}
            disabled={!isDirty}
          >
            保存
          </button>
        </div>
      </form>
    </Modal>
  );
}
function Home() {
  const { defaultView, IndexedSetupMap } = useCalendarAppState();
  const { state } = useLocation();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const date = useCalendarMee(({ date }) => date);
  const setOpenSearchParamFunction = useCallback(
    (key: "setting" | "edit", value: boolean | string) => {
      const options = openSearchParamFunction({
        key,
        searchParams,
        state,
        value,
      });
      if (typeof options === "number") nav(options);
      else setSearchParams(...options);
    },
    [state, searchParams]
  );
  const isVisible = useMemo(() => IndexedSetupMap.get("kv"), [IndexedSetupMap]);
  return (
    <>
      <CalendarSettingForm />
      <CalendarAppEventEdit />
      {isVisible ? (
        <CalendarMee
          openAddEvents={() =>
            setOpenSearchParamFunction("edit", date.toISOString())
          }
          openSetting={() => setOpenSearchParamFunction("setting", true)}
          height={800}
          defaultView={defaultView as Type_VIEW_FC}
          linkMoveReplace
        />
      ) : null}
    </>
  );
}
