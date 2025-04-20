import { dataParse } from "@/functions/dataParse";

namespace WK {
  let countdownId: NodeJS.Timeout | null = null;
  let countdownTime = 0;
  addEventListener("message", (e) => {
    function Post<T = WkSendDataType>(message: T, options?: WindowPostMessageOptions) {
      postMessage(JSON.stringify(message), options);
    }
    const data = dataParse<WkReceiveDataType>(e.data);
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
          countdownTime--;
          Post({ countdownTime });
          if (countdownTime < 0 && countdownId) { clearInterval(countdownId); }
        }, 1000);
      } else {
        countdownId = null;
      }
    }
  });
}