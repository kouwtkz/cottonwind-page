import { getGitLogData, getGitLogDataProps, getGitLogItemList } from "./gitlog";
import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";

interface GitLogObjectProps extends getGitLogDataProps {
  gitlogJsonPath?: string
}
export function getGitLogReduced(gitLogList: GitLogItemType[]) {
  const gitLogReduced: GitItemJsonType[] = [];
  gitLogList.forEach(({ ymd, message }) => {
    const found = gitLogReduced.find(a => a.date === ymd);
    if (found) {
      if (found.messages.every(m => m !== message)) found.messages.push(message);
    }
    else gitLogReduced.push({ date: ymd, messages: [message] });
  });
  gitLogReduced.forEach(log => {
    log.messages.sort((a, b) => b.startsWith("Update ") || b.length < 8 ? -1 : 0)
  })
  return gitLogReduced;
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