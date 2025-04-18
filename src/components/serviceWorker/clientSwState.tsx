import { CreateObjectState } from "@/state/CreateState";
import { useCallback, useEffect } from "react";
import "./clientSw";
import { connectingSw, sendMessage } from "./clientSw";

export const useSwState = CreateObjectState<SwStateType>({
  received: null,
  regist: null,
  sw: null,
  countdown: null,
  sendMessage,
});

export function SwState() {
  const { Set, regist } = useSwState();
  useEffect(() => {
    connectingSw?.then((regist) => {
      if (regist) {
        Set({ regist, sw: regist.active });
      }
    });
  }, []);
  const receiveCallback = useCallback(
    (e: MessageEvent<any>) => {
      if (regist && e.source === regist.active) {
        const set: Partial<SwStateType> = { received: e.data };
        if (typeof e.data.countdownTime === "number")
          set.countdown = e.data.countdownTime;
        Set(set);
      }
    },
    [regist]
  );
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", receiveCallback);
      return () => {
        navigator.serviceWorker.removeEventListener("message", receiveCallback);
      };
    }
  }, [regist]);
  return <></>;
}
