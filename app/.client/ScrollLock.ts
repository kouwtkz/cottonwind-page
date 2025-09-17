function scrollbarXVisible(element: HTMLElement) {
  return element.scrollHeight > element.clientHeight;
}

function scrollLockHandle(e: Event) {
  const html = document.querySelector("html");
  if (html?.classList.contains("scrollLock")) {
    let pD = e.target! as HTMLElement | null;
    while (pD && !scrollbarXVisible(pD) && pD.clientHeight === pD.scrollHeight) {
      pD = pD.parentElement;
    }
    if (!pD || (pD.parentElement || pD).classList.contains("scrollLock")) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}
const pf = { passive: false };

document.addEventListener("wheel", scrollLockHandle, pf);
document.addEventListener("touchmove", scrollLockHandle, pf);

const html = typeof window === "object" ? document.querySelector("html") : null;
let scrollLockCount = 0;
export function scrollLock(m: boolean) {
  if (m) {
    scrollLockCount++;
    html?.classList.add("scrollLock");
  } else {
    if (--scrollLockCount === 0) {
      html?.classList.remove("scrollLock");
    } else if (scrollLockCount < 0) scrollLockCount = 0;
  }
}
