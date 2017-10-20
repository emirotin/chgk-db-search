const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbFile = path.join(__dirname, "db.sqlite3");
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.loadExtension(path.join(__dirname, "fts5stemmer.dylib"));
  db.all(
    "select * from search where search match ? order by rank  limit 10",
    ["дилемма заключённого"],
    (err, results) => {
      if (err) {
        console.error(err);
        return;
      }
      if (!results) {
        console.error("No results");
        return;
      }
      results.map(r => r.question).forEach(q => {
        console.log(q);
        console.log();
      });
    }
  );
});
db.close();
