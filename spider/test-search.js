const lunr = require("lunr");
const fs = require("fs");
const path = require("path");

const INDEX_NAME = "db-index.json";

const indexDump = JSON.parse(fs.readFileSync(path.join(__dirname, INDEX_NAME)));
lunr.multiLanguage("en", "ru");
const index = lunr.Index.load(indexDump);
