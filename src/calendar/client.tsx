import ReactDOM from "react-dom/client";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import "@/components/hook/ScrollLock";
import { ClickEffect } from "@/components/click/ClickEffect";
import { ClickEventState } from "@/components/click/useClickEvent";
import { Theme } from "@/components/theme/Theme";
import {
  CalendarMee,
  CalendarMeeState,
  FC_VIEW_MONTH,
  Type_VIEW_FC,
  useCalendarMee,
} from "./CalendarMee";
import { LocalStorageClass } from "@/functions/storage/LocalStorageClass";
import { CreateObjectState, CreateState } from "@/state/CreateState";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldValues, useForm } from "react-hook-form";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Modal } from "@/layout/Modal";
import { ToFormTime } from "@/functions/DateFunction";
import { EventClickArg } from "@fullcalendar/core/index.js";
import { toast, ToastContainer } from "react-toastify";
import {
  defaultToastContainerOptions,
  toastLoadingShortOptions,
} from "@/components/define/toastContainerDef";
import { ToastProgressState } from "@/state/ToastProgress";
import { RiEdit2Line } from "react-icons/ri";
import { SiteMenuSwitchButtons } from "@/layout/SiteMenu";

const DEFAULT_VIEW: Type_VIEW_FC = FC_VIEW_MONTH;

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

export const CalendarAppClass = new LocalStorageClass<CalendarAppClassType>(
  "calendarAppData"
);
function ToEventMap(events: EventsDataType[]) {
  return new Map(events.map<[string, EventsDataType]>((v) => [v.id, v]));
}
function getFromJsonData(): CalendarAppClassTypeWithMap {
  const data = CalendarAppClass.getItem();
  data?.events?.forEach((item) => {
    item.start = new Date(item.start);
    item.end = new Date(item.end);
  });
  const eventsMap = ToEventMap(data?.events || []);
  return { ...data, eventsMap };
}

export const useCalendarAppState = CreateObjectState<CalendarAppStateType>(
  (set) => ({
    googleApiKey: null,
    defaultView: DEFAULT_VIEW,
    ...getFromJsonData(),
    save({
      event,
      events,
      googleApiKey,
      googleCalendarId: _id,
      overwrite,
      eventsMap,
      defaultView,
    }: CalendarAppStateSaveProps = {}) {
      set((state) => {
        const options: Partial<CalendarAppClassTypeWithMap> = {};
        if (event || events) {
          options.eventsMap = state.eventsMap;
          if (events && overwrite) {
            options.eventsMap = ToEventMap(events);
          } else {
            const eventsMap = options.eventsMap;
            if (event && event.id) {
              let entry: EventsDataType | undefined;
              if (eventsMap.has(event.id)) {
                entry = { ...eventsMap.get(event.id)!, ...event };
              } else {
                if (event.start && event.end) entry = event as EventsDataType;
              }
              if (entry) {
                eventsMap.set(entry.id, entry);
              }
            }
          }
        }
        if (eventsMap) {
          options.eventsMap = eventsMap;
        }
        if (options.eventsMap) {
          options.events = Array.from(options.eventsMap.values());
        }
        if (typeof googleApiKey !== "undefined") {
          options.googleApiKey = googleApiKey;
        }
        if (typeof _id !== "undefined") {
          const googleCalendarId = Array.isArray(_id) ? _id : [_id];
          if (overwrite) {
            options.googleCalendarId = googleCalendarId;
          } else {
            if (options.googleCalendarId) options.googleCalendarId = [];
            googleCalendarId.forEach((item) => {
              if (options.googleCalendarId!.every((v) => v.id !== item.id)) {
                options.googleCalendarId!.push(item);
              }
            });
          }
        }
        if (defaultView) {
          options.defaultView = defaultView;
        }
        CalendarAppClass.setItem({
          ...{
            events: state.events,
            googleApiKey: state.googleApiKey,
            googleCalendarId: state.googleCalendarId,
            defaultView: state.defaultView,
          },
          ...options,
        });
        return options;
      });
    },
    removeEvent(id) {
      set((state) => {
        state.eventsMap.delete(id);
        state.save({ eventsMap: state.eventsMap });
        return {};
      });
    },
    addEventsEdit(date) {
      const newDate = date ? new Date(date) : new Date();
      newDate.setMilliseconds(0);
      newDate.setSeconds(0);
      const start = new Date(newDate);
      start.setMinutes(0);
      start.setHours(start.getHours() + 1);
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      set({
        edit: { id: window.crypto.randomUUID(), start, end },
      });
    },
    isEdit: false,
    edit: null,
  })
);
function Root() {
  const { events, googleApiKey, googleCalendarId, Set } = useCalendarAppState();
  useEffect(() => {
    document.querySelector("html")?.classList.remove("loading");
  }, []);
  const EditButton = useCallback(
    ({ event }: CalendarMeeEventSubComponentProps) => {
      if (event.raw) return null;
      else
        return (
          <div className="absoluteCorner bottom right">
            <button
              type="button"
              className="large"
              title="編集"
              onClick={() => {
                Set({ edit: event });
              }}
            >
              <RiEdit2Line />
            </button>
          </div>
        );
    },
    []
  );
  return (
    <>
      <div className="calendar-app">
        <CalendarMeeState
          events={events}
          googleApiKey={googleApiKey}
          googleCalendarList={googleCalendarId}
          SubComponent={EditButton}
        />
        <Outlet />
      </div>
    </>
  );
}

const calendarAppEventEditSchema = z.object({});
function CalendarAppEventEdit() {
  const {
    Set,
    edit: stateEdit,
    events,
    save,
    removeEvent,
  } = useCalendarAppState();
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
  }, [isOpenForm])
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
      Set({ edit: null });
    },
    []
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
  return (
    <Modal
      className="calendarAppEdit"
      isOpen={isOpenForm}
      onClose={() => {
        if (!isDirty || confirm("編集中ですが編集画面から離脱しますか？")) {
          Set({ edit: null });
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
});
const useCalendarSettingForm = CreateState(false);
function CalendarSettingForm() {
  const { googleApiKey, googleCalendarId, events, save, defaultView } =
    useCalendarAppState();
  const { reload, view } = useCalendarMee();
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { isDirty, dirtyFields, errors },
  } = useForm<FieldValues>({
    values: {
      googleApiKey: googleApiKey || "",
      googleCalendarId_1: googleCalendarId?.[0] || "",
    },
    resolver: zodResolver(googleCalendarSchema),
  });
  const Submit = useCallback(() => {
    if (isDirty) {
      const options: CalendarAppStateSaveProps = { overwrite: true };
      const values = getValues();
      if ("googleApiKey" in values)
        options.googleApiKey = values.googleApiKey || null;
      if ("googleCalendarId_1" in values) {
        options.googleCalendarId = [];
        if (values.googleCalendarId_1)
          options.googleCalendarId.push(values.googleCalendarId_1);
      }
      save(options);
      reload({ syncOverwrite: true });
      setIsOpenForm(false);
    }
  }, [googleApiKey, googleCalendarId, events, isDirty]);
  const [isOpenForm, setIsOpenForm] = useCalendarSettingForm();
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
            save({ defaultView: view });
            location.reload();
          }}
        >
          {isDefault
            ? "現在のビューはデフォルトです"
            : "現在のビューをデフォルトにする"}
        </button>
      </div>
    );
  }, [defaultView, view]);
  return (
    <Modal
      className="calendarAppEdit"
      isOpen={isOpenForm}
      onClose={() => {
        if (!isDirty || confirm("編集中ですが編集画面から離脱しますか？")) {
          setIsOpenForm(false);
        }
      }}
      timeout={60}
    >
      <form className="flex" onSubmit={handleSubmit(Submit)}>
        <h2>カレンダーの設定</h2>
        <SetDefaultView />
        <h2>テーマの設定</h2>
        <SiteMenuSwitchButtons />
        <h2>Googleカレンダーの設定</h2>
        <label>
          <span className="label-l">Google API</span>
          <input
            title="Google API Key"
            placeholder="Google API Key"
            {...register("googleApiKey")}
          />
        </label>
        <label>
          <span className="label-l">カレンダーID</span>
          <input
            title="Google Calendar ID"
            placeholder="Google Calendar ID"
            {...register("googleCalendarId_1")}
          />
        </label>
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
  const { isEdit, events, Set, addEventsEdit, defaultView } =
    useCalendarAppState();
  const openSettingForm = useCalendarSettingForm()[1];
  const date = useCalendarMee(({ date }) => date);
  const eventOpen = useCallback(
    (e: EventClickArg) => {
      if (isEdit) {
        if (e.event.url) {
          toast(
            "外部から読み込まれたカレンダーは読み取り専用になります",
            toastLoadingShortOptions
          );
        } else if (events) {
          const edit = events.find((event) => event.id === e.event.id);
          if (edit) Set({ edit });
        }
        return false;
      } else return true;
    },
    [isEdit]
  );
  return (
    <>
      <CalendarSettingForm />
      <CalendarAppEventEdit />
      <CalendarMee
        eventOpen={eventOpen}
        openAddEvents={() => addEventsEdit(date)}
        openSetting={() => openSettingForm(true)}
        height={800}
        defaultView={defaultView as Type_VIEW_FC}
      />
    </>
  );
}
