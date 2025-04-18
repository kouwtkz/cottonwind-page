namespace SW {
  declare const self: ServiceWorkerGlobalScope;
  let countdownId: NodeJS.Timeout | null = null;
  let countdownTime = 0;
  addEventListener("message", (e) => {
    function Post<T = SwSendDataType>(message: T, options?: WindowPostMessageOptions) {
      if (e.source) {
        e.source.postMessage(message, options);
      }
    }
    switch (typeof e.data) {
      case "string":
        if (e.data.startsWith("{")) {
          const data = JSON.parse(e.data) as SwReceiveDataType;
          if (data.notification) {
            self.registration.showNotification(data.notification)
          }
          if (data.ping) {
            const sendTime = new Date(data.ping);
            Post({ message: (new Date().getTime() - sendTime.getTime()).toString() + "ms" });
          }
          if (typeof data.setCountdown !== "undefined") {
            if (countdownId !== null) {
              clearInterval(countdownId);
            }
            if (data.setCountdown) {
              countdownTime = data.setCountdown;
              countdownId = setInterval(() => {
                if (--countdownTime < 0) {
                  Post({ countdownTime });
                  clearInterval(countdownId!);
                } else {
                  Post({ countdownTime });
                }
              }, 1000);
            } else {
              countdownId = null;
            }
          }
        }
        break;
    }
  });
}
