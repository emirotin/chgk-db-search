#!/bin/bash

dir=$(pwd)
cd "$(dirname "$0")"

ts=$(date '+%Y%m%d-%H%M%S')
archive="db-$ts.tar.gz"

cd db && \
( rm -f db*.tar.gz db.bak 2>/dev/null || : ) && \
( cp db.sqlite3 db.bak 2>/dev/null || : ) && \
npm run db:update && \
tar -czvf $archive db.sqlite3 && \
env $(cat .env | xargs) ./node_modules/.bin/github-release upload \
  --owner emirotin \
  --repo chgk-db-dumps \
  --tag "$ts" \
  --name "$archive" \
  --body "DB v$ts" \
  $archive && \
( rm -f db.bak $archive 2>/dev/null || : ) && \
( echo "Done" && exit 0; ) || \
( ( mv db.bak db.sqlite3 2>/dev/null || : ) && echo "Error" && exit 1; )
