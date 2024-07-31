const ROOT = process.env.ROOT || "";
import childProcess from "child_process";
type targetType = "" | "site" | "image" | "character" | "embed" | "sound";

export function MediaUpdateNpx(targets: targetType | targetType[] = "") {
  const cd = ROOT ? `cd ${ROOT} && ` : "";
  if (!Array.isArray(targets)) targets = [targets];
  targets.forEach((target) => {
    const cmd = cd + "npx tsx -r dotenv/config ./src/mediaScripts/dataUpdate/runUpdateScript.ts" + (target ? ` ${target}` : "");
    childProcess.execSync(cmd, { windowsHide: true });
  })
}

const port = 5073;
export async function MediaUpdate(targets: targetType | targetType[] = "") {
  if (!Array.isArray(targets)) targets = [targets];
  await Promise.all(targets.map((target) =>
    fetch("http://localhost:" + port + "/" + target)
  ));
}
