import { readdirSync } from "fs";
import { resolve } from "path";

const cwd = `${process.cwd()}/${process.env.ROOT || ""}`;

export function GetEmbed() {
  try {
    const root = resolve(`${cwd}/_data/embed`).replaceAll("\\", "/") + "/";
    return readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((item) => item.isFile())
      .map(item => item.path.replaceAll("\\", "/").replace(root, "") + "/" + item.name);
  } catch (e) { console.error(e) }
  return [];
}
