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
	""" RPC interface used by the web server
	"""

	def __init__(self, db_name, testing_profile=False, **kwargs):
		assert type(db_name) == str
		assert testing_profile in [True, False]

		xmlrpc.XMLRPC.__init__(self, **kwargs)

		self.db = mongoengine.connect(db_name)
		self.db_name = db_name
		self.testing_profile = testing_profile

		if self.testing_profile:
			self.db.drop_database(self.db_name)

	def xmlrpc_testing_drop_database(self):
		""" Drops the entire database for testing purpose
		"""
		if self.testing_profile != True:
			return

		self.db.drop_database(self.db_name)

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
			return chunk.content
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
	from twisted.internet import reactor
	import argparse
	import sys

	parser = argparse.ArgumentParser(
		description='Runs the HiddenFaces\' data server.'
	)
	parser.add_argument("--testing",
		help="turns on the testing profile",
		action="store_true",
		dest="testing_profile"
	)
	args = parser.parse_args(sys.argv[1:])

	db_name = 'test_db'

	data_manager = DataManager(
		db_name=db_name,
		testing_profile=args.testing_profile,
		allowNone=True
	)
	reactor.listenTCP(7080, server.Site(data_manager))
	reactor.run()
