const path = require("path");
const FILE_NAME = process.argv[2] || "db-new.sqlite3";
const TARGET_FILE = path.join(__dirname, "..", "db", FILE_NAME);

const { downloadDb } = require("../lib/download-db");

downloadDb(TARGET_FILE)
  .then(() => {
    console.log("Download");
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
