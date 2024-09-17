import { getGitLogData } from "./gitlog";
import { resolve } from "path";
import { writeFileSync } from "fs";

let output = "gitlog.json"
let dir: string | undefined;
let branch: string | undefined;
type previousType = "" | "output" | "dir" | "branch";

process.argv.reduce<previousType>((a, c) => {
  if (c.startsWith("-")) {
    switch (c) {
      case "-o":
      case "--output":
        return "output";
      case "-d":
      case "--dir":
        return "dir";
      case "-b":
      case "--branch":
        return "branch";
      case "-h":
      case "--help":
        console.log("--output, -o: Output filename (default: gitlog.json)");
        console.log("--dir, -d: Target directry (default: current directory)");
        console.log("--branch, -b: Git branch name (default: auto main branch)");
        console.log("--help, -h: Help");
        process.exit();
      default:
        return "";
    }
  } else {
    switch (a) {
      case "dir":
        dir = c;
        break;
      case "output":
        output = c;
        break;
      case "branch":
        branch = c;
        break;
    }
    return "";
  }
}, "");

const outputPath = resolve(output);
writeFileSync(outputPath, JSON.stringify(getGitLogData({ dir, branch })));
console.log("Written " + outputPath);
