const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbFile = path.join(__dirname, "db.sqlite3");
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.loadExtension(path.join(__dirname, "fts5stemmer.dylib"));
  db.all(
    "select * from search where search match ? order by rank  limit 10",
    ["пушкин"],
    (e, r) => {
      r.map(r => r.question).forEach(q => {
        console.log(JSON.stringify(q));
        console.log();
      });
    }
  );
});
db.close();
