const rootCas = require("ssl-root-cas").create();
require("https").globalAgent.options.ca = rootCas;

const Promise = require("bluebird");
const request = Promise.promisify(require("request"));
const xml2json = require("xml2json");
const Queue = require("promise-queue");
Queue.configure(Promise);

const MAX_CONCURRENT_FETCHES = 100;

const getUrl = n => `https://db.chgk.info/tour/${n}/xml`;

const realFetchUrl = n =>
  request(getUrl(n), {
    strictSSL: false
  })
    .get("body")
    .then(body =>
      xml2json.toJson(body, {
        object: true,
        alternateTextNode: "$text"
      })
    );

const fetchQueue = new Queue(MAX_CONCURRENT_FETCHES, Infinity);

const fetchUrl = n => fetchQueue.add(() => realFetchUrl(n));

fetchUrl(0).tap(console.log);
