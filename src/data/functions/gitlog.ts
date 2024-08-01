import { execSync } from "child_process";
import { resolve } from "path";
import { writeFileSync } from "fs";

interface getGitLogDataProps { branch?: string, dir?: string };
export function getGitLogData(args: getGitLogDataProps = {}): GitLogDataType {
  let remote_url: string | undefined;
  try {
    const remote = execSync('git remote').toString().replace(/^\s+|\s+$/g, '');
    remote_url = execSync('git remote get-url ' + remote).toString().replace(/^\s+|\s+$/g, '');
  } catch { }
  return { remote_url, list: getGitLogItemList(args) };
}
export function getGitLogItemList({
  branch = execSync('git branch --contains').toString().slice(2, -1), dir
}: getGitLogDataProps = {}): GitLogItemType[] {
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

export function writeGitLogData() {
  const outputPath = resolve(process.argv[2] ?? "gitlog.json");
  writeFileSync(outputPath, JSON.stringify(getGitLogData()));
  console.log("Written " + outputPath);
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
