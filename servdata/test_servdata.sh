#!/bin/sh

DB_DIR="test.db"

cd "`dirname $0`/../"
mkdir $DB_DIR
mongod --dbpath $DB_DIR --logpath "$DB_DIR/mongod.log" &
MONGO_PID=$!

sleep 1

cd servdata
py.test test_servdata.py

kill -9 $MONGO_PID

sleep 1

exit 0
