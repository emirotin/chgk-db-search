const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");
const JSONStream = require("JSONStream");

const lunr = require("lunr");
require("lunr-languages/lunr.stemmer.support")(lunr);
require("lunr-languages/lunr.ru")(lunr);
require("lunr-languages/lunr.multi")(lunr);

const DUMP_NAME = "db-dump.json";
const INDEX_NAME = "db-index.json";

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

const stream = JSONStream.parse("docs.*");

let i = 0;
stream.on("data", doc => {
  indexBuilder.add(doc);
  i++;
  if (!(i % 1000)) {
    console.log(`Processed ${i} entries`);
  }
});

stream.on("end", () => {
  const index = indexBuilder.build();

  fs.writeFileSync(path.join(__dirname, INDEX_NAME), JSON.stringify(index));
});

fs.createReadStream(path.join(__dirname, DUMP_NAME)).pipe(stream);
