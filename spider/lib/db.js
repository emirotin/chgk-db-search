const Promise = require("bluebird");
const knex = require("knex");
const { parseInt } = require("lodash");
const sqlite = require("sqlite3");
const dateFormat = require("dateformat");
const semver = require("semver");
const debug = require("debug")("chgk-db:spider:db");

const knexConfig = require("../knexfile");
const _createSearchIndex = require("./search-index");

const defaultForEmptyObj = (obj, def = null) => {
  if (!obj) return def;
  if (typeof obj === "object" && !Object.keys(obj).length) return def;
  return obj;
};

const getTable = ({ db, trx, tableName }) => {
  const t = db(tableName);
  if (trx) {
    return t.transacting(trx);
  }
  return t;
};

const findKey = ({ db, trx, tableName, whereFields, keyField = "id" }) =>
  getTable({
    db,
    trx,
    tableName
  })
    .select(keyField)
    .where(whereFields)
    .get(0)
    .then(record => (record ? record[keyField] : null));

const findTouramentId = ({ db, trx, whereFields }) =>
  findKey({
    db,
    trx,
    tableName: "tournaments",
    whereFields
  });

const upsert = ({
  db,
  trx,
  tableName,
  whereFields,
  dataFields,
  keyField = "id"
}) =>
  findKey({
    db,
    trx,
    tableName,
    whereFields,
    keyField
  }).then(key =>
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
    return getTable({
      db,
      trx,
      tableName
    })
      .insert(Object.assign({}, updateFields, extraInsertFields))
      .get(0);
  } else {
    return getTable({
      db,
      trx,
      tableName
    })
      .where(keyField, key)
      .update(updateFields)
      .thenReturn(key);
  }
};

const tournamentType = dbType => {
  switch (dbType) {
    case "Т":
      return "tour";
    case "Ч":
      return "tournament";
    default:
      return "group";
  }
};

const questionType = dbType => {
  switch (dbType) {
    case "Ч":
    case "ЧД":
    case "ЧБ":
    case "И":
      return "chgk";
    case "Б":
    case "ДБ":
    case "БД":
      return "brain";
    case "Я":
      return "si";
    case "Э":
      return "loto";
    case "Л":
      return "no-wings";
    default:
      return "group";
  }
};

const DbManager = () => {
  const db = knex(knexConfig);

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
    return currentTrx.rollback();
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
      getTable({
        db,
        trx: currentTrx,
        tableName: "tournaments"
      }).update({
        obsolete: 1
      }),
      getTable({
        db,
        trx: currentTrx,
        tableName: "questions"
      }).update({
        obsolete: 1
      })
    ]);

  const upsertTournament = Promise.method((data, parentId = null) => {
    const dbId = parseInt(data.Id);

    debug(`Upsert tour #${dbId}`);

    const newRecord = {
      dbId,
      parentId,
      parentDbId: parseInt(data.ParentId || 0),
      type: tournamentType(data.Type),
      dbTextId: data.TextId || "",
      number: defaultForEmptyObj(data.Number),

      title: dbId === 0 ? "<корень>" : data.Title || "?",

      dbCreatedAt: data.CreatedAt ? new Date(data.CreatedAt) : null,
      dbUpdatedAt: data.LastUpdated ? new Date(data.LastUpdated) : null,

      lastSpideredAt: new Date(),
      obsolete: null
    };

    return upsert({
      db,
      trx: currentTrx,
      tableName: "tournaments",
      whereFields: {
        dbId
      },
      dataFields: newRecord
    }).catch(e => {
      debug("Upsert tour error:", e);
      throw e;
    });
  });

  const upsertQuestion = Promise.method((data, tournamentId) => {
    const dbId = parseInt(data.QuestionId);

    debug(`Upsert question #${dbId}`);

    const newRecord = {
      dbId,
      tournamentDbId: parseInt(data.ParentId),
      tournamentId,
      type: questionType(data.Type),
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
      whereFields: {
        dbId
      },
      dataFields: newRecord
    }).catch(e => {
      debug("Upsert question error:", e);
      throw e;
    });
  });

  const createSearchIndex = () => {
    console.log("Building search index...");
    return db.client
      .acquireConnection()
      .then(_createSearchIndex)
      .then(() => {
        console.log("Search index built.");
      });
  };

  const getDbVersionComponents = () => {
    const schemaV = getTable({
      db,
      trx: currentTrx,
      tableName: "knex_migrations"
    })
      .count("id as count")
      .get(0)
      .get("count");

    const questionsV = getTable({
      db,
      trx: currentTrx,
      tableName: "tournaments"
    })
      .max("dbUpdatedAt as dbUpdatedAt")
      .get(0)
      .get("dbUpdatedAt")
      .then(ts => dateFormat(new Date(ts), "yyyymmddHHMMss", true));

    const package = require("../package.json");
    const packageV = semver.major(package.version);

    return Promise.join(schemaV, questionsV, (schemaV, questionsV) => ({
      proto: packageV,
      schema: schemaV,
      dump: questionsV
    }));
  };

  const recordDbVersion = () =>
    getDbVersionComponents().then(versions => {
      const types = Object.keys(versions);
      const maxLength = Math.max(...types.map(t => t.length));

      return Promise.map(types, type => {
        const value = versions[type];
        console.log(`${type.padStart(maxLength)} version: ${value}`);
        return upsert({
          db,
          trx: currentTrx,
          tableName: "versions",
          keyField: "type",
          whereFields: { type },
          dataFields: { value }
        }).catch(e => {
          debug("Upsert version error:", e);
          throw e;
        });
      });
    });

  const getDbVersion = () =>
    getDbVersionComponents().then(
      ({ proto, schema, dump }) => `proto${proto}-schema${schema}-dump${dump}`
    );

  return {
    upsertTournament,
    upsertQuestion,
    markAllObsolete,
    run,
    createSearchIndex,
    recordDbVersion,
    getDbVersion
  };
};

exports.DbManager = DbManager;
