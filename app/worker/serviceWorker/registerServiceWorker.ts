interface setServiceWorkerOptions {
  wait?: number;
  onUpdate?(registration: ServiceWorkerRegistration): void;
}

export async function setServiceWorker(registPath: string, { wait = 0, onUpdate }: setServiceWorkerOptions = {}) {
  if ("serviceWorker" in navigator) {
    return new Promise<ServiceWorkerRegistration | null>(async (res) => {
      navigator.serviceWorker
        .register(registPath, { type: "module", scope: "/" })
        .then(async (registration) => {
          navigator.serviceWorker.getRegistrations().then(list => {
            list
              .filter(v => v !== registration && v.active?.scriptURL === registration.active?.scriptURL)
              .forEach((found) => {
                return found.unregister();
              })
          })
          console.log("SW registered.", registration);
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                  if (onUpdate) onUpdate(registration);
                }
              }
            }
          }
          setTimeout(() => {
            res(registration);
          }, wait);
        })
        .catch(() => {
          res(null);
        });
    }).then(async (reg) => {
      return reg
    });
  }
}

export async function removeServiceWorker(registPath: string) {
  if ("serviceWorker" in navigator) {
    return navigator.serviceWorker.getRegistration(registPath).then((reg) => {
      reg?.unregister();
    });
  }
}

interface connectServiceWorkerProps extends setServiceWorkerOptions {
  path: string;
  key?: string;
  version?: string;
}
export async function connectServiceWorker({
  path,
  key = import.meta.env?.VITE_STORAGE_KEY_SW || "service-worker-version",
  version = import.meta.env?.VITE_VERSION_SW_CALENDAR || "",
  ...props
}: connectServiceWorkerProps) {
  return new Promise<void>((res) => {
    const storage = (globalThis.localStorage || null) as Storage | null;
    const localVersion = storage?.getItem(key);
    if ((import.meta.env?.DEV || version !== localVersion) && storage) {
      removeServiceWorker(path).finally(() => res());
      storage.setItem(key, version);
    } else {
      res();
    }
  }).then(() => setServiceWorker(path, props));
}
