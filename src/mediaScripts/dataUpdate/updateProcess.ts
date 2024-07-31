const ROOT = process.env.ROOT || "";
import { CommonContext } from "@/types/HonoCustomType";
import childProcess from "child_process";
type targetType = "" | "site" | "image" | "character" | "embed" | "sound";

interface MediaUpdateProps {
  c: CommonContext;
  path?: string;
  targets?: targetType | targetType[];
}
export async function MediaUpdate({ c, path = process.env.MEDIA_UPDATE_URL_PATH, targets = "" }: MediaUpdateProps) {
  const Url = new URL(c.req.url);
  const origin = Url.origin;
  if (!Array.isArray(targets)) targets = [targets];
  await Promise.all(targets.map((target) =>
    fetch(origin + path, { body: target, method: "POST" })
  ));
}

interface MediaUpdateNpxProps {
  targets?: targetType | targetType[];
}
export function MediaUpdateNpx({ targets = "" }: MediaUpdateNpxProps) {
  const cd = ROOT ? `cd ${ROOT} && ` : "";
  if (!Array.isArray(targets)) targets = [targets];
  targets.forEach((target) => {
    const cmd = cd + "npx tsx -r dotenv/config ./src/mediaScripts/dataUpdate/runUpdateScript.ts" + (target ? ` ${target}` : "");
    childProcess.execSync(cmd, { windowsHide: true });
  })
}
