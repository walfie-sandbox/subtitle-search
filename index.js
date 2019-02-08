const path = require("path");
const fs = require("fs");
const parser = require("subtitles-parser");
const readline = require("readline");
const FlexSearch = require("flexSearch");
const TinySegmenter = require("tiny-segmenter");

const inputFiles = process.argv.slice(2);
const segmenter = new TinySegmenter();

const index = new FlexSearch({
  profile: "memory",
  tokenize: text => segmenter.segment(text),
});

let docs = {};

const main = async () => {
  const data = await Promise.all(inputFiles.map(async (filePath) => {
    const file = await fs.promises.readFile(filePath, "utf-8");
    let items = parser.fromSrt(file, false);
    let fileName = path.basename(filePath, ".srt");

    items.forEach(item => {
      const id = `${fileName}:${item.id}`;
      item.episode = fileName;
      item.id = id;

      docs[id] = item;

      index.add(id, item.text);
    });
  }));

  // To persist the index:
  // process.stdout.write(index.export());
  // process.exit();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = () => {
    rl.question("Enter a search term: ", (input) => {
      const results = index.search(input, results => {
        results.forEach(id => console.log(docs[id]));
        console.log();
        ask();
      });
    });
  };

  ask();

};

main();

