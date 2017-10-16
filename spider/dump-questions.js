const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");

const { DbManager } = require("./lib/db");

const dbManager = DbManager();

const BATCH_SIZE = 1000;
const INDEX_NAME = "db-dump.json";

const getBatch = n =>
  dbManager
    .getQuestions()
    .offset(n * BATCH_SIZE)
    .limit(BATCH_SIZE);

let allDocs = [];

const processBatch = n =>
  getBatch(n).then(docs => {
    if (!docs || !docs.length) {
      return false;
    }
    allDocs = allDocs.concat(docs);
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
  return runInner().then(() => allDocs);
};

run()
  .then(allDocs => {
    fs.writeFileSync(
      path.join(__dirname, INDEX_NAME),
      JSON.stringify({
        buildTime: new Date().toISOString(),
        docs: allDocs
      })
    );
  })
  .then(() => process.exit(0));
