// @ts-check
import { execSync } from "child_process";

export function getGitLog() {
  try {
    const remote = execSync('git remote').toString().replace(/^\s+|\s+$/g, '');
    const remote_url = execSync('git remote get-url ' + remote).toString().replace(/^\s+|\s+$/g, '');
    const gitLog = execSync('git log --first-parent master --no-merges --pretty=format:"%ad__,%s" --date=format:"%Y/%m/%d %H:%M:%S"')
    const gitLogList = gitLog.toString().split("\n").map(v => v.split("__,"))
      .map(([date, message]) => ({ date: new Date(date), message }))
      .map(({ date, message }) => ({ ymd: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`, date, message }));
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
    /** @type {GitObjectType} */
    const gitObject = { list: gitLogReduced, remote_url };
    return gitObject;
  } catch (e) {
    console.log(e);
    return null;
  }
}