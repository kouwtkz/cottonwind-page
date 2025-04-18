interface SwReceiveDataType {
  notification?: string;
  setCountdown?: number | null;
  ping?: Date;
}

interface SwSendDataType {
  code?: number;
  message?: string;
  countdownTime?: number;
}

interface SwStateType {
  received: SwSendDataType | null;
  countdown: number | null;
  regist: ServiceWorkerRegistration | null;
  sw: ServiceWorker | null;
  sendMessage(message: SwReceiveDataType): void;
}
