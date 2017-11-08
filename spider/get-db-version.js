const { DbManager } = require("./lib/db");

const dbManager = DbManager();

dbManager
  .getDbVersion()
  .then(res => {
    console.log(res);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
