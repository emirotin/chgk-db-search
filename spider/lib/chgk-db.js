const rootCas = require("ssl-root-cas").create();
require("https").globalAgent.options.ca = rootCas;

const Promise = require("bluebird");
const request = require("request-promise");
const xml2json = require("xml2json");
const Queue = require("promise-queue");
Queue.configure(Promise);

const { TournamentsManager } = require("./db");

const MAX_CONCURRENT_FETCHES = 100;

const getUrl = n => `https://db.chgk.info/tour/${n}/xml`;

const ChgkDbManager = (maxConcurrentFetches = MAX_CONCURRENT_FETCHES) => {
  const requestPool = { maxSockets: 10 };

  const fetchQueue = new Queue(MAX_CONCURRENT_FETCHES, Infinity);

  const tournamentsManager = TournamentsManager();

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

  const fetchChildren = (node, level) => {
    let { tour } = node;
    if (!tour) return;
    if (!Array.isArray(tour)) {
      tour = [tour];
    }
    return Promise.map(tour, tour => fetchUrl(tour.Id, level + 1));
  };

  const fetchUrl = (n, level = 0) =>
    fetchQueue
      .add(() =>
        Promise.delay(1000 * Math.random()).then(() => realFetchUrl(n))
      )
      .then(({ tournament: data }) => {
        return Promise.all([
          tournamentsManager.upsertTournament(data),
          fetchChildren(data, level)
        ]);
      });

  const fetchDb = () => fetchUrl(0);

  return { fetchDb };
};

exports.ChgkDbManager = ChgkDbManager;
