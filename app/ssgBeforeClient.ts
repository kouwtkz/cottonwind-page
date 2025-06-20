import { CookieToThemeClassNames } from "./components/theme/ThemeCookie";
import { getCookieObjectFromDocument } from "./components/utils/Cookie";

if (import.meta.env.PROD && globalThis.document) {
  const html = document.querySelector("html");
  if (html) {
    const cookie = getCookieObjectFromDocument(document);
    CookieToThemeClassNames(cookie).forEach((item) => {
      html.classList.add(item);
    });
  }
}
