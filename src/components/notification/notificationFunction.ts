import { connectServiceWorker } from "../serviceWorker/setFunction";
const path = import.meta.env?.DEV
  ? "/src/components/serviceWorker/swNotification.ts"
  : "/assets/swNotification.js";
let sw: ServiceWorker | null = null;
connectServiceWorker({ path }).then((e) => {
  sw = e?.active || null;
});

export function sendNotification(message: string) {
  sw?.postMessage(JSON.stringify({ notification: message }));
}