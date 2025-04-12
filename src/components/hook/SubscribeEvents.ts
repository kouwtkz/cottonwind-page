export class SubscribeEventsClass<N = string> {
  events: { name: N; event: EventFunction }[];
  emitSwitchEvents(name: N, ...arg: any[]) { }
  subscribe?: EventCallback;
  constructor() {
    this.events = [];
  }
  on(name: N, event: EventFunction) {
    this.events.push({ name, event });
  }
  remove(name: N, event: EventFunction) {
    const found = this.events.findIndex(
      (v) => v.name === name && v.event === event
    );
    this.events.splice(found, 1);
  }
  emit(name: N, ...arg: any[]) {
    this.emitSwitchEvents(name, ...arg);
    this.events
      .filter((item) => item.name === name)
      .forEach(({ event }) => {
        event.apply(event, arg);
      });
  }
  getSubscribe(name: N): EventCallback {
    return (callback) => {
      this.on(name, callback);
      return () => this.remove(name, callback);
    };
  }
}
