import { mkdirSync, readdirSync, copyFileSync, statSync, rmSync, rmdirSync } from "fs";
import { basename, resolve } from "path";
const cwd = resolve(`${process.cwd()}/${process.env.ROOT || ""}`);

export default function CopyDirDiff(from: string, to: string,
  { identical = false, withDir = true, force = false, ignore, ignoreDir }: CopyDirOptions = {}) {
  from = from.replace(/[\\/]+/g, "/").replace(/\/$/, "");
  to = (withDir ? to + "/" + basename(from) : to).replace(/[\\/]+/g, "/");
  try { mkdirSync(to, { recursive: true }) } catch { }
  const alreadyDirents = readdirSync(to, { recursive: true, withFileTypes: true })
    .map(dirent => ({ path: resolve(`${dirent.path}/${dirent.name}`), isFile: dirent.isFile() }));
  const outputDirents: { path: string, isFile: boolean }[] = [];
  const cwdFrom = resolve(`${cwd}/${from}`);
  readdirSync(cwdFrom, { recursive: true, withFileTypes: true }).forEach(dirent => {
    const cutPath = dirent.path.replace(cwd, "").replace(/[\\/]+/g, "/").replace(/^\//, "");
    const itemFrom = resolve(`${dirent.path}/${dirent.name}`);
    const itemTo = resolve(`${to}/${cutPath.replace(/[\\/]+/g, "/").replace(from, "")}/${dirent.name}`);
    const isDirectory = dirent.isDirectory();
    if (ignoreDir && (isDirectory ? `${cutPath}/${dirent.name}` : cutPath).match(ignoreDir)) return;
    if (ignore && !isDirectory && dirent.name.match(ignore)) return;
    if (identical) outputDirents.push({ path: itemTo, isFile: dirent.isFile() });
    if (isDirectory) {
      if (alreadyDirents.every(dirent => dirent.path !== itemTo)) mkdirSync(itemTo);
    } else {
      if (force || alreadyDirents.every(dirent => dirent.path !== itemTo)) {
        copyFileSync(itemFrom, itemTo)
      } else {
        const mtimeFrom = new Date(statSync(itemFrom).mtime);
        const mtimeTo = new Date(statSync(itemTo).mtime);
        if (mtimeFrom.getTime() > mtimeTo.getTime()) copyFileSync(itemFrom, itemTo)
      }
    }
  })
  if (identical) {
    const notfoundList = alreadyDirents.filter(dirent => outputDirents.every(_dirent => dirent.path !== _dirent.path));
    notfoundList.reverse().forEach(dirent => {
      if (dirent.isFile) rmSync(dirent.path);
      else rmdirSync(dirent.path);
    })
  }
}
