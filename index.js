const path = require("path");
const fs = require("fs");
const parser = require("subtitles-parser");
const lunr = require("lunr");

require("lunr-languages/lunr.stemmer.support.js")(lunr);
require("lunr-languages/tinyseg")(lunr);
require("lunr-languages/lunr.jp.js")(lunr);

const inputFiles = process.argv.slice(2);

const main = async () => {
  const data = await Promise.all(inputFiles.map(async (filePath) => {
    const file = await fs.promises.readFile(filePath, "utf-8");
    let items = parser.fromSrt(file, true);
    let fileName = path.basename(filePath, ".srt");

    return items.map(item => ({
      ...item,
      id: `${fileName}:${item.id}`,
      episode: fileName,
    }));
  }));

  const idx = lunr(config => {
    config.use(lunr.jp);
    config.field("text");

    data.flat().forEach(d => config.add(d));
  });

  console.log(idx.search("アイカツ"));

  // To persist the index:
  // process.stdout.write(JSON.stringify(idx));
};

main();

