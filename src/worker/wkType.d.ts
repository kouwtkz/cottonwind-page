interface WkReceiveDataType {
  setCountdown?: number | null;
  ping?: Date;
  message?: string;
}

interface WkSendDataType {
  code?: number;
  message?: string;
  countdownTime?: number;
}

interface WkStateType {
  received: SwSendDataType | null;
  countdown: number | null;
  regist: ServiceWorkerRegistration | null;
  sw: ServiceWorker | null;
  sendMessage(message: SwReceiveDataType): void;
}
