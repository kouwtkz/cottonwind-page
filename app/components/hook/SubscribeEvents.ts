export class SubscribeEventsAbstractClass<N = string> {
  events: { name: N; event: EventFunction }[];
  emitSwitchEvents(name: N, ...arg: any[]) { }
  subscribe?: EventCallback;
  constructor() {
    this.events = [];
  }
  addEventListener(name: N, event: EventFunction) {
    this.events.push({ name, event });
  }
  removeEventListener(name: N, event: EventFunction) {
    const found = this.events.findIndex(
      (v) => v.name === name && v.event === event
    );
    this.events.splice(found, 1);
  }
  emitEvent(name: N, ...arg: any[]) {
    this.emitSwitchEvents(name, ...arg);
    this.events
      .filter((item) => item.name === name)
      .forEach(({ event }) => {
        event.apply(event, arg);
      });
  }
  getSubscribe(name: N): EventCallback {
    return (callback) => {
      this.addEventListener(name, callback);
      return () => this.removeEventListener(name, callback);
    };
  }
}

type DefaultNType = "update";
export class SubscribeEventsClass<D> extends SubscribeEventsAbstractClass<DefaultNType> {
  data?: D;
  subscribe: EventCallback;
  constructor(v?: D) {
    super();
    this.subscribe = this.getSubscribe("update");
    this.data = v;
  }
  GetData() {
    return this.data;
  }
  SetData(v?: D) {
    const diff = this.data !== v;
    this.data = v;
    if (diff) this.emitEvent("update");
  }
}