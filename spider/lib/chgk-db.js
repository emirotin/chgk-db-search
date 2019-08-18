const Promise = require("bluebird");
const request = require("request-promise");
const xml2json = require("xml2json");
const Queue = require("promise-queue");
Queue.configure(Promise);
const debug = require("debug")("chgk-db:spider:chgk-db");

const { DbManager } = require("./db");

const MAX_CONCURRENT_FETCHES = 100;
const MAX_CONNECTIONS = 10;

const getUrl = n => `https://db.chgk.info/tour/${n}/xml`;

const ChgkDbManager = ({
  maxConcurrentFetches = MAX_CONCURRENT_FETCHES,
  maxConnections = MAX_CONNECTIONS
} = {}) => {
  const requestPool = {
    maxSockets: maxConnections
  };

  const fetchQueue = new Queue(maxConcurrentFetches, Infinity);

  const dbManager = DbManager();

  const realFetchUrl = n =>
    request(getUrl(n), {
      pool: requestPool
    }).then(body => {
      try {
        body = body.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ");
        return xml2json.toJson(body, {
          object: true,
          alternateTextNode: "$text"
        });
      } catch (err) {
        debug(err, body);
        throw err;
      }
    });

  const fetchChildren = (data, parentId) => {
    let { tour } = data;
    if (!tour) return;
    if (!Array.isArray(tour)) {
      tour = [tour];
    }

    return Promise.map(tour, tour => fetchUrl(tour.Id, parentId));
  };

  const upsertQuestions = (data, tournamentId) => {
    let { question } = data;
    if (!question) return;
    if (!Array.isArray(question)) {
      question = [question];
    }

    return Promise.map(question, question =>
      dbManager.upsertQuestion(question, tournamentId)
    );
  };

  const fetchUrl = (n, parentId) => {
    debug(`Fetching tour #${n}`);

    return fetchQueue
      .add(() =>
        Promise.delay(1000 * Math.random()).then(() => realFetchUrl(n))
      )
      .then(({ tournament: data }) =>
        dbManager
          .upsertTournament(data, parentId)
          .then(tournamentId =>
            Promise.all([
              upsertQuestions(data, tournamentId),
              fetchChildren(data, tournamentId)
            ])
          )
      );
  };

  const fetchDb = () =>
    dbManager
      .run(() =>
        dbManager
          .markAllObsolete()
          .then(() => fetchUrl(0))
          .then(dbManager.recordDbVersion)
      )
      .then(dbManager.createSearchIndex);

  return {
    fetchDb
  };
};

exports.ChgkDbManager = ChgkDbManager;
