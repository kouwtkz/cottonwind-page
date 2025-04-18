import { connectServiceWorker } from "./setFunction";

const path = import.meta.env?.VITE_PATH_SW_NOTIFICATION;
let sw: ServiceWorker | null = null;
export let connectingSw: Promise<ServiceWorkerRegistration | null | undefined> | undefined;
if (path) {
  connectingSw = connectServiceWorker({ path });
  connectingSw.then((e) => {
    sw = e?.active || null;
  });
}

export function sendMessage(message: SwReceiveDataType) {
  sw?.postMessage(JSON.stringify(message));
}

export function sendNotification(message: string) {
  sendMessage({ notification: message });
}
