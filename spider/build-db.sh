#!/bin/bash

dir=$(pwd)
cd "$(dirname "$0")"

cd db && \
npm run db:migrate && \
prevDbVer=$(node ../get-db-version.js) && \
( rm -f db*.tar.gz db.bak 2>/dev/null || : ) && \
( cp db.sqlite3 db.bak 2>/dev/null || : ) && \
npm run db:update && \
( rm -f db.bak $archive 2>/dev/null || : ) && \
currDbVer=$(node ../get-db-version.js) && \
echo "Prev DB version: $prevDbVer" && \
echo "New  DB version: $currDbVer" && \
if [[ $currDbVer != $prevDbVer ]]; then
  archive="db-$currDbVer.tar.gz" && \
  tar -czvf $archive db.sqlite3 && \
  echo "Publishing $archive" && \
  env $(cat ../.env | xargs) ../node_modules/.bin/github-release upload \
    --owner emirotin \
    --repo chgk-db-dumps \
    --tag "$currDbVer" \
    --name "$currDbVer" \
    --body "DB ver. $currDbVer" \
    $archive && \
  ( rm -f $archive 2>/dev/null || : )
else
  echo "Nothing new, not publishing"
fi && \
( echo "Done" && exit 0; ) || \
( ( mv db.bak db.sqlite3 2>/dev/null || : ) && echo "Error" && exit 1; )
