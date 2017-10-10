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

const TournamentsManager = () => {
  const db = knex(Object.assign({ useNullAsDefault: true }, config));

  const upsertTournament = data => {
    const dbId = parseInt(data.Id);
    const newRecord = {
      dbId: dbId,
      parentDbId: parseInt(data.ParentId || 0),
      title: dbId === 0 ? "<корень>" : data.Title || "?",
      dbTextId: data.TextId || "",
      number: defaultForEmptyObj(data.Number),
      dbCreatedAt: new Date(data.CreatedAt),
      dbUpdatedAt: new Date(data.LastUpdated)
    };

    const table = db("tournaments");

    const parentId = db("tournaments")
      .select("id")
      .where("dbId", newRecord.parentDbId)
      .get(0)
      .then(record => (record ? record.id : null));

    const existingRecordId = db("tournaments")
      .select("id")
      .where("dbId", dbId)
      .get(0)
      .then(record => (record ? record.id : null));

    return Promise.join(
      parentId,
      existingRecordId,
      (parentId, existingRecordId) => {
        newRecord.parentId = parentId;
        if (!existingRecordId) {
          return db("tournaments").insert(newRecord);
        } else {
          return db("tournaments")
            .where("id", existingRecordId)
            .update(newRecord);
        }
      }
    ).catch(e => {
      console.log(e);
      throw e;
    });
  };

  return { upsertTournament };
};

exports.TournamentsManager = TournamentsManager;
