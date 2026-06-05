export function Sleep(time: number) {
  return new Promise<void>((rs) => {
    setTimeout(() => rs(), time);
  })
}
