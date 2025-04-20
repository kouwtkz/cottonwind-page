import { dataParse } from "@/functions/dataParse";

namespace WK {
  let countdownId: NodeJS.Timeout | null = null;
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
        let countdownTime = data.setCountdown;
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setSeconds(endDate.getSeconds() + countdownTime);
        countdownId = setInterval(() => {
          const currentDate = new Date();
          countdownTime = Math.round((endDate.getTime() - currentDate.getTime()) / 1000);
          Post({ countdownTime });
          if (countdownTime < 0 && countdownId) { clearInterval(countdownId); }
        }, 1000);
      } else {
        countdownId = null;
      }
    }
  });
}