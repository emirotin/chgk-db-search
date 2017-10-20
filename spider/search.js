const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbFile = path.join(__dirname, "db.sqlite3");
const db = new sqlite3.Database(dbFile);

const query = process.argv
  .slice(2)
  .join(" ")
  .replace(/ё/g, "е")
  .replace(/Ё/g, "Е");

db.serialize(() => {
  db.loadExtension(path.join(__dirname, "fts5stemmer.dylib"));
  db.all(
    "select * from search where search match ? order by rank limit 10",
    [query],
    (err, results) => {
      if (err) {
        console.error(err);
        return;
      }
      if (!results || !results.length) {
        console.warn("Ничего не найдено.");
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
