interface SwReceiveDataType {
  notification?: string;
  ping?: Date;
  message?: string;
}

interface SwSendDataType {
  code?: number;
  message?: string;
}

interface SwStateType {
  received: SwSendDataType | null;
  regist: ServiceWorkerRegistration | null;
  sw: ServiceWorker | null;
  sendMessage(message: SwReceiveDataType): void;
}
