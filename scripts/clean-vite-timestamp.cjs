const fs = require("fs");
fs.readdirSync("./")
  .filter(v => v.match("vite.config.ts.timestamp-*"))
  .forEach(v => {
    fs.rmSync(v);
    console.log(v);
  });
