const { ChgkDbManager } = require("./lib/chgk-db");

const chgkDbManager = ChgkDbManager();

if (process.env.TRAVIS_EVENT_TYPE) {
  setInterval(() => {
    console.log("Staying alive...");
  }, 1000 * 60);
}

chgkDbManager
  .fetchDb()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("error:", error);
    process.exit(1);
  });
