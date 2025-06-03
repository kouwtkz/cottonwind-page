export function getUUID() {
  return window.crypto.randomUUID
    ? window.crypto.randomUUID()
    : new Date().getTime().toString(16);
}