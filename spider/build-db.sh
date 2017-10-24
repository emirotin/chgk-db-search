#!/bin/bash
dir=$(pwd)
cd "$(dirname "$0")"

ts=$(date '+%Y%m%d-%H%M%S')
archive="db-$ts.tar.gz"

( rm -f db*.tar.gz db.bak 2>/dev/null || : ) && \
( cp db.sqlite3 db.bak 2>/dev/null || : ) && \
npm run db:update && \
tar -czvf $archive db.sqlite3 && \
( rm -f db.bak 2>/dev/null || : ) && \
( echo "Done" && exit 0; ) || \
( ( mv db.bak db.sqlite3 2>/dev/null || : ) && echo "Error" && exit 1; )
