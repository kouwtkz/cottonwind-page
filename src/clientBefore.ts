const cookie = Object.fromEntries(document.cookie.split(/;\s*/).map(v => v.split("=")));
const html = document.querySelector("html");
function cookieToClass(cookieName: string, element = html) {
  if (element) {
    if (cookie[cookieName]) {
      element.classList.add(cookie[cookieName]);
    }
  }
}
cookieToClass(import.meta.env!.VITE_THEME_COLOR_KEY);
cookieToClass(import.meta.env!.VITE_THEME_DARK_KEY);

import "@/test"
