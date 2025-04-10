import ReactDOM from "react-dom/client";
import { useEffect, useSyncExternalStore } from "react";
import {
  EventCallback,
  SubscribeEventsClass,
} from "./components/hook/SubscribeEvents";
import { DOMContentLoaded } from "./clientScripts";

class Test2 {}
const test2 = new Test2();

type Test1_Types = "test" | "mee";
class Test1 extends SubscribeEventsClass<Test1_Types, Test2> {
  test2: Test2;
  subscribe: EventCallback;
  constructor(cls: Test2) {
    super(cls);
    this.test2 = cls;
    this.subscribe = this.getSubscribe("test");
  }
  override emitSwitchEvents(name: Test1_Types): void {
    switch (name) {
      case "test":
        console.log("分岐に成功");
        test1.test2 = new Test2();
        break;
    }
  }
}
const test1 = new Test1(test2);

function Test() {
  const a = useSyncExternalStore(test1.subscribe, test1.snapshot);
  console.log(a);
  useEffect(() => {
    test1.emit("test");
  }, []);
  return <></>;
}

function LoadedFunction() {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <>
      <Test />
    </>
  );
}

// DOMContentLoaded(LoadedFunction);
