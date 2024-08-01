import { getGitLogData, getGitLogItemList, getGitLogReduced } from "./gitlog";

export function GitLogObject() {
  let { list, remote_url } = getGitLogData()
  list = getGitLogItemList({ branch: "main", dir: "_data" }).concat(list);
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