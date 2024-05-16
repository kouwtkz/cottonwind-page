// @ts-check
import { execSync } from "child_process";

/**
 * @param {{branch?: string, dir?: string}} param0 
 */
export function getGitLogDataList({ branch = "master", dir } = {}) {
  try {
    /** @type string[] */
    const execList = [];
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

/**
 * 
 * @param {GitLogDataType[]} gitLogList 
 * @returns 
 */
export function getGitLogReduced(gitLogList) {
  /** @type { GitItemType[] } */
  const gitLogReduced = [];
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
    list.sort((a, b) => a.date < b.date ? 1 : -1)
    const gitLogReduced = getGitLogReduced(list);
    /** @type {GitObjectType} */
    const gitObject = { list: gitLogReduced, remote_url };
    return gitObject;
  } catch (e) {
    console.log(e);
    return null;
  }
}