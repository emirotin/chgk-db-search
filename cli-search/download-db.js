const { downloadDb } = require("../ui-electron/lib/download-db");

downloadDb("db-new.sqlite3")
  .then(() => {
    console.log("OK");
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
