namespace SW {
  declare const self: ServiceWorkerGlobalScope;
  addEventListener("message", (event) => {
    switch (typeof event.data) {
      case "string":
        if (event.data.startsWith("{")) {
          const data = JSON.parse(event.data);
          if (data.notification) {
            self.registration.showNotification(data.notification)
          }
        }
        break;
    }
  });
}
