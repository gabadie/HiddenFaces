#!/usr/bin/env python
# -*- coding: utf-8 -*-

import mongoengine
from twisted.web import xmlrpc, server

class DataChunk(mongoengine.Document):
	title = mongoengine.StringField(required=True, unique=True)
	owner = mongoengine.StringField(required=True)
	content = mongoengine.ListField(mongoengine.StringField())
	append_enabled = mongoengine.BooleanField(default=False)

class DataManager(xmlrpc.XMLRPC):

	def xmlrpc_new_chunk(self, title, owner, content, append_enabled):

		chunk = None

		try:
			chunk = DataChunk.objects.get(title=title)
		except mongoengine.DoesNotExist as e:
			chunk = DataChunk(title=title,owner=owner,content=content,append_enabled=append_enabled).save()


	def xmlrpc_write_chunk(self, title, user, content):

		chunk = None

		try:
			chunk = DataChunk.objects.get(title=title)
		except mongoengine.DoesNotExist as e:
			return

		if chunk.owner == user:
			chunk.content = content
			chunk.save()

	def xmlrpc_read_chunk(self, title):

		chunk = None

		try:
			chunk = DataChunk.objects.get(title=title)
			return chunk
		except mongoengine.DoesNotExist as e:
			return None

	def xmlrpc_append_content(self, title, content):

		chunk = None

		try:
			chunk = DataChunk.objects.get(title=title)
		except mongoengine.DoesNotExist as e:
			return

		if chunk.append_enabled:
			chunk.content.append(content)
			chunk.save()

	def xmlrpc_delete_chunk(self, title, owner):

		chunk = None

		try:
			chunk = DataChunk.objects.get(title=title)
		except mongoengine.DoesNotExist as e:
			return

		if chunk.owner == owner:
			chunk.delete()


if __name__ == "__main__":
	db = mongoengine.connect('test_db')
	db.drop_database('test_db')

	user = DataChunk(title="cc",owner="cc").save()

	print DataChunk.objects.to_json()