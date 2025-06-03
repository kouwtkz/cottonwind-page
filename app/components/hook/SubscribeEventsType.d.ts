type EventFunction = (...arg: any) => void;
type EventCallback = (callback: () => void) => () => void;

declare class SubscribeEventsClass<N = string> {
  events: { name: N; event: EventFunction }[];
  emitSwitchEvents(name: N, ...arg: any[]): void;
  subscribe?: EventCallback;
  on(name: N, event: EventFunction): void;
  remove(name: N, event: EventFunction): void;
  emit(name: N, ...arg: any[]): void;
  getSubscribe(name: N): EventCallback;
}
