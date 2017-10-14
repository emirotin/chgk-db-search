const { ChgkDbManager } = require("./lib/chgk-db");

const chgkDbManager = ChgkDbManager();

chgkDbManager.fetchDb().then(() => process.exit(0));
