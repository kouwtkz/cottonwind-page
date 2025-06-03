export function FormToNumber(v?: string) {
  const nv = Number(v);
  return isNaN(nv) ? null : nv;
}

export function FormToBoolean(v?: string) {
  switch (v) {
    case "true":
      return true;
    case "false":
      return false;
    case "null":
    case "undefined":
      return null;
    default:
      return;
  }
}
