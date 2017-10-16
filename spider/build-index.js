const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");

const lunr = require("lunr");
require("lunr-languages/lunr.stemmer.support")(lunr);
require("lunr-languages/lunr.ru")(lunr);
require("lunr-languages/lunr.multi")(lunr);

const { DbManager } = require("./lib/db");

const dbManager = DbManager();

const BATCH_SIZE = 1000;
const INDEX_NAME = "db-index.json";

const getBatch = n =>
  dbManager
    .getQuestions()
    .offset(n * BATCH_SIZE)
    .limit(BATCH_SIZE);

const indexBuilder = new lunr.Builder();

indexBuilder.use(lunr.multiLanguage("en", "ru"));

indexBuilder.field("question");
indexBuilder.field("answer");
indexBuilder.field("altAnswers");
indexBuilder.field("comments");
indexBuilder.field("authors");
indexBuilder.field("sources");
indexBuilder.ref("id");

indexBuilder.metadataWhitelist = ["position"];

const processBatch = n =>
  getBatch(n).then(docs => {
    if (!docs || !docs.length) {
      return false;
    }
    docs.forEach(doc => indexBuilder.add(doc));
    return true;
  });

const run = () => {
  let n = 0;
  const runInner = prevResult => {
    if (prevResult === false) {
      return Promise.resolve();
    }
    console.log(`Process batch #${n}`);
    return processBatch(n++).then(runInner);
  };
  return runInner().then(() => indexBuilder.build());
};

run()
  .then(index => {
    fs.writeFileSync(path.join(__dirname, INDEX_NAME), JSON.stringify(index));
  })
  .then(() => process.exit(0));
