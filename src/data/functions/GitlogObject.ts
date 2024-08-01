import { getGitLogData, getGitLogDataProps, getGitLogItemList, getGitLogReduced } from "./gitlog";
import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";

interface GitLogObjectProps extends getGitLogDataProps {
  gitlogJsonPath?: string
}
export function GitLogObject({ gitlogJsonPath = "./_data/gitlog", ...args }: GitLogObjectProps = {}) {
  let { list, remote_url } = getGitLogData(args)
  list = getGitLogItemList({ branch: "main", dir: "_data" }).concat(list);
  try {
    readdirSync(gitlogJsonPath).map(name =>
      JSON.parse(String(readFileSync(resolve(gitlogJsonPath, name)))) as GitLogDataType
    ).forEach(data => {
      list = list.concat(data.list)
    });
  } catch { }
  list = list.filter(item => {
    switch (item.message) {
      case "update _data":
      case "データ更新":
        return false;
      default: return true;
    }
  });
  list.sort((a, b) => a.date < b.date ? 1 : -1)
  const gitLogReduced = getGitLogReduced(list);
  const gitObject: GitObjectJsonType = { list: gitLogReduced, remote_url };
  return gitObject;
}