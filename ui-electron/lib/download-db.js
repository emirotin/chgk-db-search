const fs = require("fs");
const zlib = require("zlib");
const Promise = require("bluebird");
const requestPromise = require("request-promise");
const request = require("request");
const tar = require("tar-stream");

const gunzip = zlib.createGunzip();
const untar = tar.extract();

const GITHUB_API = "https://api.github.com";
const GITHUB_REPO = "emirotin/chgk-db-dumps";

const PROTO = 2;

exports.downloadDb = targetFile =>
  requestPromise(`${GITHUB_API}/repos/${GITHUB_REPO}/releases`, {
    json: true,
    headers: {
      "User-Agent": "node"
    }
  })
    .then(releases =>
      releases
        .filter(r => r.tag_name.startsWith(`proto${PROTO}-`))
        .map(r => ({ ...r, published_at: new Date(r.published_at) }))
        .sort((r1, r2) => r2.published_at - r1.published_at)
    )
    .then(releases => {
      if (!releases.length) {
        throw new Error(`No releases found for proto v${PROTO}`);
      }
      return releases[0].assets[0];
    })
    .then(
      ({ browser_download_url: url }) =>
        new Promise((resolve, reject) => {
          console.log("Downloading", url);

          const stream = request(url)
            .pipe(gunzip)
            .pipe(untar);

          stream.on("error", reject);
          untar.on("error", reject);

          let entries = 0;
          untar.on("entry", (_header, entryStream, _next) => {
            entries += 1;
            if (entries > 1) {
              return reject(new Error("Too many tar entries"));
            }

            entryStream.on("error", reject);

            entryStream
              .pipe(fs.createWriteStream(targetFile))
              .on("close", resolve);
          });
        })
    );
