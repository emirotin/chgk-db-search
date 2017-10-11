const rootCas = require("ssl-root-cas").create();
require("https").globalAgent.options.ca = rootCas;

const Promise = require("bluebird");
const request = require("request-promise");
const xml2json = require("xml2json");
const Queue = require("promise-queue");
Queue.configure(Promise);

const { DbManager } = require("./db");

const MAX_CONCURRENT_FETCHES = 100;

const getUrl = n => `https://db.chgk.info/tour/${n}/xml`;

const ChgkDbManager = (maxConcurrentFetches = MAX_CONCURRENT_FETCHES) => {
  const requestPool = { maxSockets: 10 };

  const fetchQueue = new Queue(MAX_CONCURRENT_FETCHES, Infinity);

  const dbManager = DbManager();

  const realFetchUrl = n =>
    request(getUrl(n), {
      strictSSL: false,
      pool: requestPool
    }).then(body =>
      xml2json.toJson(body, {
        object: true,
        alternateTextNode: "$text"
      })
    );

  const fetchChildren = data => {
    let { tour } = data;
    if (!tour) return;
    if (!Array.isArray(tour)) {
      tour = [tour];
    }

    return Promise.map(tour, tour => fetchUrl(tour.Id));
  };

  const upsertQuestions = (trx, data, tournamentId) => {
    let { question } = data;
    if (!question) return;
    if (!Array.isArray(question)) {
      question = [question];
    }

    return Promise.map(question, question =>
      dbManager.upsertQuestion(trx, tournamentId, question)
    );
  };

  const fetchUrl = (trx, n) =>
    fetchQueue
      .add(() =>
        Promise.delay(1000 * Math.random()).then(() => realFetchUrl(n))
      )
      .then(({ tournament: data }) =>
        dbManager.upsertTournament(trx, data).then(tournamentId =>
          Promise.all([
            fetchChildren(data)
            //upsertQuestions(trx, data, tournamentId)
          ])
        )
      );

  const fetchDb = () =>
    dbManager
      .run()
      .then(trx => fetchUrl(trx, 0))
      .then(dbManager.commit)
      .catch(dbManager.rollback);

  return { fetchDb };
};

exports.ChgkDbManager = ChgkDbManager;
