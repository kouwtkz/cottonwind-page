import { execSync } from "child_process";

export interface getGitLogDataProps { branch?: string, dir?: string };
export function getGitLogData(args: getGitLogDataProps = {}): GitLogDataType {
  let remote_url: string | undefined;
  try {
    const remote = execSync('git remote').toString().trim();
    remote_url = execSync('git remote get-url ' + remote).toString().trim();
  } catch { }
  return { remote_url, list: getGitLogItemList(args) };
}
export function getGitLogItemList({
  branch = execSync('git branch --contains').toString().match(/\*\s([^\n]+)/)?.[1] || "", dir
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
