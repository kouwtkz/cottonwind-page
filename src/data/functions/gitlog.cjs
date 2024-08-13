"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var path_1 = require("path");
var fs_1 = require("fs");
function getGitLogData(args) {
    if (args === void 0) { args = {}; }
    var remote_url;
    try {
        var remote = (0, child_process_1.execSync)('git remote').toString().trim();
        remote_url = (0, child_process_1.execSync)('git remote get-url ' + remote).toString().trim();
    }
    catch (_a) { }
    return { remote_url: remote_url, list: getGitLogItemList(args) };
}
function getGitLogItemList(_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.branch, branch = _c === void 0 ? (0, child_process_1.execSync)('git branch --contains').toString().slice(2, -1) : _c, dir = _b.dir;
    try {
        var execList = [];
        if (dir)
            execList.push('cd ' + dir);
        execList.push("git log --first-parent ".concat(branch, " --no-merges --pretty=format:\"%ad__,%s\" --date=format:\"%Y/%m/%d %H:%M:%S\""));
        var gitLog = (0, child_process_1.execSync)(execList.join(' & '));
        return gitLog.toString().split("\n").map(function (v) { return v.split("__,"); })
            .map(function (_a) {
            var date = _a[0], message = _a[1];
            return ({ date: new Date(date), message: message });
        })
            .map(function (_a) {
            var date = _a.date, message = _a.message;
            return ({ ymd: "".concat(date.getFullYear(), "/").concat(date.getMonth() + 1, "/").concat(date.getDate()), date: date, message: message });
        });
    }
    catch (e) {
        console.log(e);
        return [];
    }
}
function writeGitLogData() {
    var _a;
    var outputPath = (0, path_1.resolve)((_a = process.argv[2]) !== null && _a !== void 0 ? _a : "gitlog.json");
    (0, fs_1.writeFileSync)(outputPath, JSON.stringify(getGitLogData()));
    console.log("Written " + outputPath);
}
writeGitLogData();
