if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(import.meta.env?.DEV ? "/src/calendar/sw.ts" : "/assets/sw.js").then((reg) => {
    console.log("SW registered.", reg);
  });
}
