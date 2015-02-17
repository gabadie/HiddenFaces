#!/usr/bin/env python
# -*- coding: utf-8 -*-

import mongoengine

class DataChunk(mongoengine.Document):
	title = mongoengine.StringField(required=True, unique=True)
	owner = mongoengine.StringField(required=True, unique=True)
	content = mongoengine.ListField(mongoengine.StringField)

if __name__ == "__main__":
    db = mongoengine.connect('test_db')
    db.drop_database('test_db')

    user = DataChunk(title="cc",owner="cc").save()

    print DataChunk.objects.to_json()