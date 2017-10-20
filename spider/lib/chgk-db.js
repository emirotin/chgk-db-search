const Promise = require("bluebird");
const request = require("request-promise");
const xml2json = require("xml2json");
const Queue = require("promise-queue");
Queue.configure(Promise);

const { DbManager } = require("./db");

const MAX_CONCURRENT_FETCHES = 100;
const MAX_CONNECTIONS = 10;

const getUrl = n => `https://db.chgk.info/tour/${n}/xml`;

const ChgkDbManager = (maxConcurrentFetches = MAX_CONCURRENT_FETCHES) => {
  const requestPool = { maxSockets: MAX_CONNECTIONS };

  const fetchQueue = new Queue(MAX_CONCURRENT_FETCHES, Infinity);

  const dbManager = DbManager();

  const realFetchUrl = n =>
    request(getUrl(n), {
      pool: requestPool
    }).then(body =>
      xml2json.toJson(body, {
        object: true,
        alternateTextNode: "$text"
      })
    );

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
    console.log(`Fetching tour #${n}`);

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
      .run(() => dbManager.markAllObsolete().then(() => fetchUrl(0)))
      .then(dbManager.createSearchIndex);

  return { fetchDb };
};

exports.ChgkDbManager = ChgkDbManager;
