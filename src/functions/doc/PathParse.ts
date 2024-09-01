export function getPathnameWithHost(path: string) {
  const queryCharPoint = path.match(/[?#]/)?.index;
  if (queryCharPoint) path = path.slice(0, queryCharPoint);
  return path;
}

export function getPathname(path: string) {
  path = getPathnameWithHost(path);
  const schemaPoint = path.indexOf("://");
  if (schemaPoint) path = path.slice(schemaPoint + 2);
  return path;
}

export function getBasename(path: string) {
  path = getPathnameWithHost(path);
  const slashPoint = path.lastIndexOf("/");
  if (slashPoint >= 0) path = path.slice(slashPoint + 1);
  return path;
}

export function getName(path: string) {
  let basename = getBasename(path);
  const slashPoint = basename.lastIndexOf(".");
  if (slashPoint >= 0) basename = basename.slice(0, slashPoint);
  return basename;
}

export function getExtension(path: string) {
  path = getPathnameWithHost(path);
  const dotCharPoint = path.lastIndexOf(".");
  path = path.toLocaleLowerCase();
  return dotCharPoint < 0 ? path : path.slice(dotCharPoint + 1);
}
