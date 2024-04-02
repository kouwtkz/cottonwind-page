// @ts-check

const ROOT = process.env.ROOT || "";
import childProcess from "child_process";
/**
 * @typedef {"" | "site" | "image" | "character" | "embed" | "sound"} targetType
 * @param {targetType | targetType[]} targets 
 */
export function MediaUpdate(targets = "") {
  const cd = ROOT ? `cd ${ROOT} && ` : "";
  if (!Array.isArray(targets)) targets = [targets];
  targets.forEach((target) => {
    const cmd = cd + "node -r dotenv/config ./src/mediaScripts/DataUpdate.mjs" + (target ? ` ${target}` : "");
    childProcess.execSync(cmd, { windowsHide: true });
  })
}
