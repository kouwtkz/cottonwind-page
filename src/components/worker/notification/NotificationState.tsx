import { CreateObjectState } from "@/state/CreateState";
import { indexedNotification, IndexedNotification_KV } from "./NotificationDB";

localStorage.removeItem("notification");

interface notificationStateType {
  isEnable: boolean;
  permission: NotificationPermission;
  map: Map<string, boolean | null> | null;
  keyValues: { [k: string]: boolean | null };
  db: IndexedNotification_KV;
  setNotification: (key?: string, value?: boolean) => void;
}
export const useNotification = CreateObjectState<notificationStateType>(
  (set) => {
    const dbSetCallbackKey: Type_MeeIndexedDB_Event = "dbSet";
    function getMapKeyValue(map: Map<string, boolean | null>) {
      const keyValues = Object.fromEntries(map.entries());
      return { map, keyValues };
    }
    function dbCallback() {
      indexedNotification.getAllMap().then((map) => {
        set(getMapKeyValue(map));
      }).finally(() => {
        indexedNotification.removeEventListener(dbSetCallbackKey, dbCallback);
      });
    }
    indexedNotification.addEventListener(dbSetCallbackKey, dbCallback);
    function checkPermission() {
      const permission = Notification.permission;
      return {
        isEnable: permission === "granted",
        permission,
      };
    }
    return {
      db: indexedNotification,
      ...checkPermission(),
      keyValues: {},
      map: null,
      setNotification(key, value = true) {
        Notification.requestPermission()
          .then(() => indexedNotification.getAllMap())
          .then((map) => {
            if (key) {
              map.set(key, value);
              indexedNotification.save({ data: map });
              set({ ...checkPermission(), ...getMapKeyValue(map) });
            } else {
              set(checkPermission());
            }
          });
      },
    };
  }
);
