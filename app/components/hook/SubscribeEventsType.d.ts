type EventFunction = (...arg: any) => void;
type EventCallback = (callback: () => void) => () => void;
