function scrollLockHandle(e: Event) {
  const html = document.querySelector("html");
  if (html?.classList.contains("scrollLock")) {
    let pD = e.target! as HTMLElement | null;
    while (
      pD &&
      (pD.classList.contains("scrollThrough") ||
        pD.clientHeight === pD.scrollHeight)
    ) {
      pD = pD.parentElement;
    }
    if (!pD || pD.parentElement?.classList.contains("scrollLock")) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}
const pf = { passive: false };

document.addEventListener("wheel", scrollLockHandle, pf);
document.addEventListener("touchmove", scrollLockHandle, pf);

const html = typeof window === "object" ? document.querySelector("html") : null;
export function scrollLock(m: boolean) {
  if (m) {
    html?.classList.add("scrollLock");
  } else {
    html?.classList.remove("scrollLock");
  }
}
