#!/usr/bin/env python
# -*- coding: utf-8 -*-

import mongoengine
from twisted.web import xmlrpc, server
import sys

sys.path.append("servdata/log/")
import log

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

		self.logger = log.get_logger("servdata/log/test.log")

		if self.testing_profile:
			self.db.drop_database(self.db_name)

	def xmlrpc_testing_drop_database(self):
		""" Drops the entire database for testing purpose
		"""
		if self.testing_profile != True:
			return

		self.db.drop_database(self.db_name)
		self.logger.info("drop database")

	def xmlrpc_new_chunk(self, title, owner, content, append_enabled):

		chunk = None
		self.logger.info("new chunk creation : title={}, owner={}, content={}, append_enabled={}".format(title,owner,content,append_enabled))
		try:
			chunk = DataChunk.objects.get(title=title)
			self.logger.info("chunk {} already existing".format(title))
		except mongoengine.DoesNotExist as e:
			chunk = DataChunk(title=title,owner=owner,content=content,append_enabled=append_enabled).save()
			self.logger.info("new chunk created")


	def xmlrpc_write_chunk(self, title, user, content):

		chunk = None
		self.logger.info("chunk modification : title={}".format(title))
		try:
			chunk = DataChunk.objects.get(title=title)
			self.logger.info("chunk found")
		except mongoengine.DoesNotExist as e:
			self.logger.error("chunk not found : error message={}".format(e))
			return

		if chunk.owner == user:
			self.logger.info("chunk modified : right owner={}".format(user))
			chunk.content = content
			chunk.save()

	def xmlrpc_read_chunk(self, title):

		chunk = None
		self.logger.info("getting chunk : title={}".format(title))

		try:
			chunk = DataChunk.objects.get(title=title)
			self.logger.info("chunk found : content={}".format(chunk.content))
			return chunk.content
		except mongoengine.DoesNotExist as e:
			self.logger.error("chunk not found : error message={}".format(e))
			return None

	def xmlrpc_append_content(self, title, content):

		chunk = None
		self.logger.info("appending content to chunk : title={}, content={}".format(title,content))

		try:
			chunk = DataChunk.objects.get(title=title)
			self.logger.info("chunk found : current content={}".format(chunk.content))
		except mongoengine.DoesNotExist as e:
			self.logger.error("chunk not found : error message={}".format(e))
			return

		if chunk.append_enabled:
			self.logger.info("content appended to chunk: new content={},{}".format(chunk.content,content))
			chunk.content.append(content)
			chunk.save()

	def xmlrpc_delete_chunk(self, title, owner):

		chunk = None
		self.logger.info("chunk deletion : title={}".format(title))

		try:
			chunk = DataChunk.objects.get(title=title)
			self.logger.info("chunk found")
		except mongoengine.DoesNotExist as e:
			self.logger.error("chunk not found : error message={}".format(e))
			return

		if chunk.owner == owner:
			self.logger.info("chunk deleted : right owner={}".format(owner))
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
