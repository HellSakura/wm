const fs = require("fs/promises");

async function run() {
  const {
    version,
    author,
    _name,
    description,
    namespace,
    match,
    grant
  } = JSON.parse(await fs.readFile("package.json"));
  const banner = `// ==UserScript==
// @name         ${_name}
// @namespace    ${namespace}
// @version      ${version}
// @description  ${description}
// @author       ${author}
// @match        ${match}
// @grant        ${grant}
// ==/UserScript==

// 本文件由 src/index.ts 生成，请修改 src/index.ts 后执行 yarn build 生成，勿直接修改此文件。

`;

  const JSFILE = "dist/index.js";
  const fileContent = await fs.readFile(JSFILE, { encoding: "utf-8" });
  await fs.writeFile(JSFILE, banner + fileContent);
}

run();
