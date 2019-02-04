const path = require("path");
const fs = require("fs");
const parser = require("subtitles-parser");
const lunr = require("lunr");
const readline = require("readline");

require("lunr-languages/lunr.stemmer.support.js")(lunr);
require("lunr-languages/tinyseg")(lunr);
require("lunr-languages/lunr.jp.js")(lunr);

const inputFiles = process.argv.slice(2);

// https://github.com/olivernn/lunr.js/issues/259#issuecomment-305833571
const builder = new lunr.Builder;
builder.use(lunr.jp);
builder.field("text");

let docs = {};

const main = async () => {
  const data = await Promise.all(inputFiles.map(async (filePath) => {
    const file = await fs.promises.readFile(filePath, "utf-8");
    let items = parser.fromSrt(file, true);
    let fileName = path.basename(filePath, ".srt");

    items.forEach(item => {
      const id = `${fileName}:${item.id}`
      item.id = id;
      docs[id] = item;
      builder.add(item);
    });
  }));

  const idx = builder.build();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = () => {
    rl.question("Enter a search term: ", (input) => {
      const results = idx.query(query => {
        query.term(
          lunr.tokenizer(input),
          { presence: lunr.Query.presence.REQUIRED }
        )
      });

      results.forEach(item => console.log(docs[item.ref]));
      console.log();
      ask();
    });
  }

  ask();

  // To persist the index:
  // process.stdout.write(JSON.stringify(idx));
};

main();

