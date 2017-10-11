const Promise = require("bluebird");
const env = process.env.NODE_ENV || "development";
const isDev = env === "development";
const config = require("../knexfile")[env];
const knex = require("knex");

const defaultForEmptyObj = (o, d) => {
  if (!o) return d;
  if (typeof o !== "object") return d;
  if (!Object.keys(o).length) return d;
  return o;
};

const findKey = ({ db, trx, tableName, whereFields, keyField = "id" }) =>
  db(tableName)
    .transacting(trx)
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
    return db(tableName)
      .transacting(trx)
      .insert(Object.assign({}, updateFields, extraInsertFields))
      .get(0);
  } else {
    return db(tableName)
      .transacting(trx)
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

  const run = () => {
    if (currentTrx) {
      throw new Error("Transaction already in progress!");
    }
    return db.transaction(trx => {
      return (currentTrx = trx);
    });
  };

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

  const upsertTournament = (trx, data) => {
    const dbId = parseInt(data.Id);
    const newRecord = {
      dbId,
      parentDbId: parseInt(data.ParentId || 0),
      title: dbId === 0 ? "<корень>" : data.Title || "?",
      dbTextId: data.TextId || "",
      number: defaultForEmptyObj(data.Number),
      dbCreatedAt: data.CreatedAt ? new Date(data.CreatedAt) : null,
      dbUpdatedAt: data.LastUpdated ? new Date(data.LastUpdated) : null
    };

    const parentId = newRecord.parentDbId
      ? findTouramentId({
          db,
          trx,
          whereFields: { dbId: newRecord.parentDbId }
        })
      : null;

    const existingRecordId = findTouramentId({
      db,
      trx,
      whereFields: { dbId }
    });

    return Promise.join(
      parentId,
      existingRecordId,
      (parentId, existingRecordId) => {
        return insertOrUpdate({
          db,
          trx,
          tableName: "tournaments",
          key: existingRecordId,
          updateFields: Object.assign(newRecord, { parentId })
        });
      }
    ).catch(e => {
      console.error(e);
      throw e;
    });
  };

  const upsertQuestion = (trx, data, tournamentId) => {
    const dbId = parseInt(data.Id);

    const newRecord = {
      dbId,
      tournamentDbId: parseInt(data.ParentId),
      tournamentId,
      dbTextId: data.TextId || "",
      number: defaultForEmptyObj(data.Number),

      question: data.Question || "",
      answer: data.Answer || "",
      altAnswers: data.PassCriteria || "",
      comments: data.Comments || "",
      authors: data.Authors || "",
      sources: data.Sources || ""
    };

    return upsert({
      db,
      trx,
      tableName: "questions",
      whereFields: { dbId },
      dataFields: newRecord
    });
  };

  return { upsertTournament, upsertQuestion, run, commit, rollback };
};

exports.DbManager = DbManager;
