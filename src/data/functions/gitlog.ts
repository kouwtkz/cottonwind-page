import { execSync } from "child_process";

export function getGitLogDataList({ branch = "master", dir }: {branch?: string, dir?: string} = {}) {
  try {
    const execList: string[] = [];
    if (dir) execList.push('cd ' + dir);
    execList.push(`git log --first-parent ${branch} --no-merges --pretty=format:"%ad__,%s" --date=format:"%Y/%m/%d %H:%M:%S"`);
    const gitLog = execSync(execList.join(' & '));
    return gitLog.toString().split("\n").map(v => v.split("__,"))
      .map(([date, message]) => ({ date: new Date(date), message }))
      .map(({ date, message }) => ({ ymd: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`, date, message }));
  } catch (e) {
    console.log(e);
    return [];
  }
}

export function getGitLogReduced(gitLogList: GitLogDataType[]) {
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

export function GitLogObject() {
  try {
    const remote = execSync('git remote').toString().replace(/^\s+|\s+$/g, '');
    const remote_url = execSync('git remote get-url ' + remote).toString().replace(/^\s+|\s+$/g, '');
    let list = getGitLogDataList({ branch: "main", dir: "_data" });
    list = list.concat(getGitLogDataList());
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
  } catch (e) {
    console.log(e);
    return null;
  }
}