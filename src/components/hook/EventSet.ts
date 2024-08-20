import { useHotkeys, HotkeyCallback, Keys } from "react-hotkeys-hook";
import { FormTags } from "react-hotkeys-hook/dist/types";

type HotkeyNoCallbackProps = { keys: Keys, preventDefault?: boolean, enableOnFormTags?: boolean | readonly FormTags[] }
type HotkeyEventProps = HotkeyNoCallbackProps & { callback: HotkeyCallback }
export function HotkeyEvent(
  { keys, callback, preventDefault = true, enableOnFormTags }: HotkeyEventProps
) {
  useHotkeys(
    keys,
    (e, h) => {
      callback(e, h);
      if (preventDefault) e.preventDefault();
    },
    { enableOnFormTags }
  );
}

type RunEventProps = {
  element?: HTMLElement | null;
  type: string;
  options?: EventInit;
}
export function RunEvent({ element, type, options = { bubbles: true, cancelable: true } }: RunEventProps) {
  element?.dispatchEvent(
    new Event(type, options)
  );
}

export function HotkeyRunEvent(args: HotkeyNoCallbackProps & RunEventProps) {
  HotkeyEvent({ ...args, callback: () => RunEvent(args) })
}