export function sleep(time: number) {
  return new Promise<void>((rs) => {
    setTimeout(() => rs(), time);
  })
}
