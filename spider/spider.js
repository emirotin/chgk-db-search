const { ChgkDbManager } = require("./lib/chgk-db");

const chgkDbManager = ChgkDbManager();

chgkDbManager
  .fetchDb()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("error:", error);
    process.exit(1);
  });
