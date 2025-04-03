export async function setServiceWorker(registPath: string, wait = 100) {
  if ("serviceWorker" in navigator) {
    return new Promise<ServiceWorkerRegistration | null>((res) => {
      navigator.serviceWorker
        .register(registPath)
        .then((reg) => {
          console.log("SW registered.", reg);
          setTimeout(() => {
            res(reg);
          }, wait);
        })
        .catch(() => {
          res(null);
        });
    }).then((reg) => reg);
  }
}

export async function removeServiceWorker(registPath: string) {
  if ("serviceWorker" in navigator) {
    return navigator.serviceWorker.getRegistration(registPath).then((reg) => {
      reg?.unregister();
    });
  }
}

interface connectServiceWorkerProps {
  path: string;
  key?: string;
  version?: string;
  wait?: number;
}
export async function connectServiceWorker({
  path,
  key = import.meta.env?.VITE_STORAGE_KEY_SW || "service-worker-version",
  version = import.meta.env?.VITE_VERSION_SW_CALENDAR || "",
  wait,
}: connectServiceWorkerProps) {
  return new Promise<void>((res) => {
    const localVersion = localStorage.getItem(key);
    if (import.meta.env?.DEV || version !== localVersion) {
      removeServiceWorker(path).finally(() => res());
      localStorage.setItem(key, version);
    } else {
      res();
    }
  }).then(() => setServiceWorker(path, wait));
}
