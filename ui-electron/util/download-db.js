const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const Promise = require("bluebird");
const requestPromise = require("request-promise");
const request = require("request");

const gunzip = zlib.createGunzip();
const tar = require("tar-stream");
const untar = tar.extract();

const GITHUB_API = "https://api.github.com";
const GITHUB_REPO = "emirotin/chgk-db-dumps";
const FILE_NAME = process.argv[2] || "db-new.sqlite3";
const TARGET_FILE = path.join(__dirname, "..", "db", FILE_NAME);

Promise.resolve(
  requestPromise(`${GITHUB_API}/repos/${GITHUB_REPO}/releases/latest`, {
    json: true,
    headers: {
      "User-Agent": "node"
    }
  })
)
  .get("assets")
  .get(0)
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
        untar.on("entry", (header, entryStream, next) => {
          entries += 1;
          if (entries > 1) {
            return reject(new Error("Too many tar entries"));
          }

          entryStream
            .pipe(fs.createWriteStream(TARGET_FILE))
            .on("close", resolve);

          entryStream.on("error", reject);
        });
      })
  )
  .then(() => {
    console.log("Download");
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
