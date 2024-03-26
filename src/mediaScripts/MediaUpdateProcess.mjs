// @ts-check

const ROOT = process.env.ROOT || "";
import childProcess from "child_process";
export function MediaUpdate() {
  const cd = ROOT ? `cd ${ROOT} && ` : "";
  const cmd = cd + "node -r dotenv/config ./src/mediaScripts/MediaUpdate.mjs";
  childProcess.execSync(cmd, { windowsHide: true });
}
