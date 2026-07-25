import 'temporal-polyfill/global'

export function getUUID() {
  return window.crypto.randomUUID
    ? window.crypto.randomUUID()
    : Temporal.Now.instant().epochMilliseconds.toString(16);
}