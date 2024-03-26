// @ts-check

import childProcess from "child_process";
import iconv from "iconv-lite";

/** @param { string } cmd  */
export default function RunProcess(cmd, utf = true) {
  const enc = utf || !/windows/i.test(process.env.OS || "") ? "utf-8" : "Shift_JIS";
  try {
    const buf = childProcess.execSync(cmd, {windowsHide: true});
    const stdout = iconv.decode(buf, enc)
    console.log(stdout);
    return stdout;
  } catch ( /** @type {any} */ e) {
    const stderr = iconv.decode(e.stderr, enc)
    console.error(stderr);
    return stderr;
  }
}
