if ("serviceWorker" in navigator) {
  const registPath = import.meta.env?.DEV ? "/src/calendar/sw.ts" : "/assets/sw.js";
  navigator.serviceWorker.getRegistration(registPath).then(reg => {
    reg?.unregister();
  })
  // navigator.serviceWorker.register(registPath).then((reg) => {
  //   console.log("SW registered.", reg);
  // });
}

export { };
