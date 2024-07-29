const ROOT = process.env.ROOT || "";
import childProcess from "child_process";
type targetType = "" | "site" | "image" | "character" | "embed" | "sound";

export function MediaUpdate(targets: targetType | targetType[] = "") {
  const cd = ROOT ? `cd ${ROOT} && ` : "";
  if (!Array.isArray(targets)) targets = [targets];
  targets.forEach((target) => {
    const cmd = cd + "npx tsx -r dotenv/config ./src/mediaScripts/DataUpdate.ts" + (target ? ` ${target}` : "");
    childProcess.execSync(cmd, { windowsHide: true });
  })
}
