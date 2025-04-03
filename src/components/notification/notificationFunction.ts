import { connectServiceWorker } from "../serviceWorker/setFunction";
const path = import.meta.env?.VITE_PATH_SW_NOTIFICATION;
let sw: ServiceWorker | null = null;
if (path) {
  connectServiceWorker({ path }).then((e) => {
    sw = e?.active || null;
  });
}

export function sendNotification(message: string) {
  sw?.postMessage(JSON.stringify({ notification: message }));
}