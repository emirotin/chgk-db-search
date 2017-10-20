const path = require("path");
const Promise = require("bluebird");
const env = process.env.NODE_ENV || "development";
const isDev = env === "development";
const config = require("../knexfile")[env];
const knex = require("knex");
const { parseInt } = require("lodash");
const sqlite = require("sqlite3");

const defaultForEmptyObj = (o, d = null) => {
  if (!o) return d;
  if (typeof o === "object" && !Object.keys(o).length) return d;
  return o;
};

const getTable = ({ db, trx, tableName }) => {
  const t = db(tableName);
  if (trx) {
    return t.transacting(trx);
  }
  return t;
};

const findKey = ({ db, trx, tableName, whereFields, keyField = "id" }) =>
  getTable({ db, trx, tableName })
    .select(keyField)
    .where(whereFields)
    .get(0)
    .then(record => (record ? record[keyField] : null));

const findTouramentId = ({ db, trx, whereFields }) =>
  findKey({ db, trx, tableName: "tournaments", whereFields });

const upsert = ({
  db,
  trx,
  tableName,
  whereFields,
  dataFields,
  keyField = "id"
}) =>
  findKey({ db, trx, tableName, whereFields, keyField }).then(key =>
    insertOrUpdate({
      db,
      trx,
      tableName,
      extraInsertFields: whereFields,
      updateFields: dataFields,
      key,
      keyField
    })
  );

const insertOrUpdate = ({
  db,
  trx,
  tableName,
  updateFields,
  extraInsertFields,
  key,
  keyField = "id"
}) => {
  if (!key) {
    return getTable({ db, trx, tableName })
      .insert(Object.assign({}, updateFields, extraInsertFields))
      .get(0);
  } else {
    return getTable({ db, trx, tableName })
      .where(keyField, key)
      .update(updateFields)
      .thenReturn(key);
  }
};

const DbManager = () => {
  const db = knex(
    Object.assign({ useNullAsDefault: true, pool: { min: 2, max: 10 } }, config)
  );

  let currentTrx = null;

  const commit = () => {
    if (!currentTrx) {
      throw new Error("Transaction is not in progress!");
    }
    return currentTrx.commit();
  };

  const rollback = () => {
    if (!currentTrx) {
      throw new Error("Transaction is not in progress!");
    }
    return currentTrx.commit();
  };

  const run = fn => {
    if (currentTrx) {
      throw new Error("Transaction already in progress!");
    }
    return db.transaction(trx => {
      currentTrx = trx;
      return Promise.resolve(fn(trx))
        .then(commit)
        .catch(rollback);
    });
  };

  const markAllObsolete = () =>
    Promise.all([
      getTable({ db, trx: currentTrx, tableName: "tournaments" }).update({
        obsolete: 1
      }),
      getTable({ db, trx: currentTrx, tableName: "questions" }).update({
        obsolete: 1
      })
    ]);

  const upsertTournament = (data, parentId = null) => {
    const dbId = parseInt(data.Id);

    console.log(`Upsert tour #${dbId}`);

    const newRecord = {
      dbId,
      parentId,
      parentDbId: parseInt(data.ParentId || 0),
      title: dbId === 0 ? "<корень>" : data.Title || "?",
      dbTextId: data.TextId || "",
      number: defaultForEmptyObj(data.Number),
      dbCreatedAt: data.CreatedAt ? new Date(data.CreatedAt) : null,
      dbUpdatedAt: data.LastUpdated ? new Date(data.LastUpdated) : null,

      lastSpideredAt: new Date(),
      obsolete: null
    };

    return upsert({
      db,
      trx: currentTrx,
      tableName: "tournaments",
      whereFields: { dbId },
      dataFields: newRecord
    }).catch(e => {
      console.error(e);
      throw e;
    });
  };

  const upsertQuestion = (data, tournamentId) => {
    const dbId = parseInt(data.QuestionId);

    console.log(`Upsert question #${dbId}`);

    const newRecord = {
      dbId,
      tournamentDbId: parseInt(data.ParentId),
      tournamentId,
      dbTextId: defaultForEmptyObj(data.TextId, ""),
      number: defaultForEmptyObj(data.Number),

      question: defaultForEmptyObj(data.Question, ""),
      answer: defaultForEmptyObj(data.Answer, ""),
      altAnswers: defaultForEmptyObj(data.PassCriteria),
      comments: defaultForEmptyObj(data.Comments, ""),
      authors: defaultForEmptyObj(data.Authors, ""),
      sources: defaultForEmptyObj(data.Sources, ""),

      obsolete: null
    };

    return upsert({
      db,
      trx: currentTrx,
      tableName: "questions",
      whereFields: { dbId },
      dataFields: newRecord
    });
  };

  const loadStemmerExt = sqlite =>
    new Promise((resolve, reject) => {
      sqlite.loadExtension(
        path.join(__dirname, "..", "fts5stemmer.dylib"),
        err => {
          if (err) {
            return reject(err);
          }
          resolve();
        }
      );
    });

  const questionContentsColumns = [
    "question",
    "answer",
    "altAnswers",
    "comments",
    "authors",
    "sources"
  ];

  const createSearchQuery = [
    "CREATE VIRTUAL TABLE",
    "search",
    "USING",
    `fts5(${questionContentsColumns.join(
      ", "
    )}, tokenize = "snowball russian english unicode61")`
  ].join(" ");

  const normalizeColumn = column =>
    `replace(replace(${column}, "ё", "е"), "Ё", "Е") as ${column}`;

  const populateSearchQuery = [
    "INSERT INTO",
    "search",
    "SELECT",
    questionContentsColumns.map(normalizeColumn).join(", "),
    "FROM",
    "questions",
    "WHERE obsolete IS NULL"
  ].join(" ");

  const runRaw = (sqlite, query) =>
    new Promise((resolve, reject) => {
      console.log(query);
      sqlite.run(query, err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

  const createSearchIndex = () => {
    console.log("Building search index...");
    return db.client
      .acquireConnection()
      .then(sqlite =>
        loadStemmerExt(sqlite)
          .then(() => runRaw(sqlite, "DROP TABLE IF EXISTS search"))
          .then(() => runRaw(sqlite, createSearchQuery))
          .then(() => runRaw(sqlite, populateSearchQuery))
      )
      .then(() => {
        console.log("Search index built");
      });
  };

  return {
    upsertTournament,
    upsertQuestion,
    markAllObsolete,
    run,
    createSearchIndex
  };
};

exports.DbManager = DbManager;
