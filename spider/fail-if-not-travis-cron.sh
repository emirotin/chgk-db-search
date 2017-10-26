#!/bin/bash
if [ "x${TRAVIS_EVENT_TYPE}x" != "xcronx" ]
then
  echo "Not in Travis cron job"
  exit 1;
fi
