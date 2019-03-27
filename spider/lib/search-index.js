const path = require("path");
const Promise = require("bluebird");

const loadStemmerExt = sqlite =>
  Promise.fromCallback(cb => {
    const extPath = path.join(
      __dirname,
      "..",
      "..",
      "stemmer-sqliteext",
      process.platform,
      "fts5stemmer"
    );
    sqlite.loadExtension(extPath, cb);
  });

const runRaw = (sqlite, query) =>
  Promise.fromCallback(cb => {
    sqlite.run(query, cb);
  });

const questionContentsColumns = [
  "question",
  "answer",
  "altAnswers",
  "comments",
  "authors",
  "sources"
];

const deleteSearchQuery = "DROP TABLE IF EXISTS search";

const createSearchQuery = [
  "CREATE VIRTUAL TABLE",
  "search",
  "USING",
  `fts5(${questionContentsColumns.join(
    ", "
  )}, tokenize = "snowball russian english unicode61", content="questions", content_rowid="id")`
].join(" ");

const normalizeColumn = column =>
  `replace(replace(${column}, "ё", "е"), "Ё", "Е") as ${column}`;

const populateSearchQuery = [
  "INSERT INTO",
  "search",
  `(rowid, ${questionContentsColumns.join(", ")})`,
  "SELECT",
  `id, ${questionContentsColumns.map(normalizeColumn).join(", ")}`,
  "FROM",
  "questions",
  "WHERE obsolete IS NULL"
].join(" ");

module.exports = sqlite =>
  loadStemmerExt(sqlite)
    .then(() => runRaw(sqlite, deleteSearchQuery))
    .then(() => runRaw(sqlite, createSearchQuery))
    .then(() => runRaw(sqlite, populateSearchQuery));
