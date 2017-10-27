const path = require("path");

const sqlite3 = require("sqlite3").verbose();

const dbFile = path.join(__dirname, "db.sqlite3");
const db = new sqlite3.Database(dbFile);

const query = process.argv
  .slice(2)
  .map(
    s =>
      `"${s
        .replace(/ё/g, "е")
        .replace(/Ё/g, "Е")
        .replace(/\s+/gi, " ")
        .replace(/"/gi, '""')}"`
  )
  .join("+");

db.serialize(() => {
  const extPath = path.join(
    __dirname,
    "sqlite-ext",
    process.platform,
    "fts5stemmer"
  );
  db.loadExtension(extPath);

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
      results.forEach(r => {
        console.log(r);
        console.log();
      });
    }
  );
});
db.close();
