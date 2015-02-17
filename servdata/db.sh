#!/bin/sh

DB_DIR="test.db"

cd "`dirname $0`/../"
mkdir $DB_DIR
mongod --dbpath $DB_DIR --logpath "$DB_DIR/mongod.log"
