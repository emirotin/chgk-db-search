const path = require("path");
module.exports = {
  client: "sqlite3",
  connection: {
    filename: path.join(__dirname, "db", "db.sqlite3")
  },
  useNullAsDefault: true,
  pool: {
    min: 2,
    max: 10
  }
};
