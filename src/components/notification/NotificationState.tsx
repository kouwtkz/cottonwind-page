import { CreateObjectState } from "@/state/CreateState";
import { LocalStorageClass } from "@/functions/storage/LocalStorageClass";

interface noticeClassKVType {
  [k: string]: boolean;
}
interface notificationStateType {
  isEnable: boolean;
  permission: NotificationPermission;
  keyValues: noticeClassKVType | null;
  setNotification: (key?: string, value?: boolean) => void;
}
export const useNotification = CreateObjectState<notificationStateType>(
  (set) => {
    const noticeStorage = new LocalStorageClass<noticeClassKVType>(
      "notification"
    );
    function checkPermission() {
      const permission = Notification.permission;
      return {
        isEnable: permission === "granted",
        permission,
      };
    }
    return {
      ...checkPermission(),
      keyValues: noticeStorage.getItem(),
      setNotification(key, value = true) {
        Notification.requestPermission().then(() => {
          let keyValues = noticeStorage.getItem() || {};
          if (key) {
            keyValues[key] = value;
            noticeStorage.setItem(keyValues);
          }
          set({ ...checkPermission(), keyValues });
        });
      },
    };
  }
);

