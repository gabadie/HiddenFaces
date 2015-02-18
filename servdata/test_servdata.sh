#!/bin/sh

sh db.sh &
sleep 1
MONGO_PID=$!

py.test test_servdata.py

kill -2 $MONGO_PID

exit 0
