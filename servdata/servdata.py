#!/usr/bin/env python
# -*- coding: utf-8 -*-

import mongoengine
from twisted.web import xmlrpc, server
import sys
import json

import log


# ------------------------------------------------------------------- DATA CHUNK

class DataChunk(mongoengine.Document):
	title = mongoengine.StringField(required=True, unique=True)
	owner = mongoengine.StringField(required=True)
	content = mongoengine.ListField(mongoengine.StringField())
	append_enabled = mongoengine.BooleanField(default=False)


# ----------------------------------------------------- DATA OPERATION MECHANISM

class DataOperation(object):
	def __init__(self, json_operation):
		""" The constructor of the inheriting object should be reimplemented to
		validate <json_operation>, without calling this one.
		"""
		raise NotImplementedError

	def process(self, transaction):
		""" Call processing the json_operation
		"""
		raise NotImplementedError

	def success(self):
		""" Method called once all the transaction's operations has successed
		"""
		raise NotImplementedError

	def failure(self, raison):
		""" Method called if at least one operation has failed
		"""
		raise NotImplementedError


""" Maps containing all data chunk's operations
"""
DATA_CHUNK_OPERATIONS = {}

""" Data chunk's operation decorator
"""
def data_chunk_op(interface_name):
	assert isinstance(interface_name, str)
	assert interface_name not in DATA_CHUNK_OPERATIONS

	def callback(class_def):
		assert issubclass(class_def, DataOperation)

		DATA_CHUNK_OPERATIONS[interface_name] = class_def

		return class_def

	return callback


class DataTransaction(object):
	""" Data chunk transaction
	"""
	class DataException(Exception):
		""" Data chunk exception
		"""
		def __init__(self, operation_id, error_msg):
			Exception.__init__(self, error_msg)
			self.operation_id = operation_id

	def __init__(self, json_operations):
		self.data_chunk_cache = {}
		self.json_operations = json_operations
		self.current_operation_id = None
		self.status = 'ok'

	def get_data_chunk(self, chunk_name):
		""" Access database
		"""
		data_chunk = None

		if chunk_name in self.data_chunk_cache:
			data_chunk = self.data_chunk_cache

		else:
			try:
				data_chunk = DataChunk.objects.get(title=chunk_name)

			except:
				self.failure('unknown data chunk `{}`'.format(chunk_name))

			self.data_chunk_cache[chunk_name] = data_chunk

		assert DataChunk != None

		return data_chunk

	def failure(self, error_msg):
		""" Fails the current database. Should be called only in
		DataOperation.process()
		"""
		assert self.current_operation_id != None
		assert self.current_operation_id >= 0
		assert self.current_operation_id < len(self.json_operations)
		assert self.status == 'ok'

		self.status = 'failed'

		raise DataTransaction.DataException(
			operation_id=self.current_operation_id,
			error_msg=error_msg
		)

	def commit(self):
		""" Commits the transaction into the database
		"""
		assert self.status == 'ok'

		for data_chunk in self.data_chunk_cache.values():
			data_chunk.save()

	@staticmethod
	def process(json_operations):
		""" json_operation = [
			{
				'__operation': '/create_data_chunk'
			}
		]
		"""
		operations = list()

		try:
			assert isinstance(json_operations, list)

			for json_operation in json_operations:
				assert isinstance(json_operation, dict)
				assert '__operation' in json_operation, 'missing __operation'
				assert json_operation['__operation'] in DATA_CHUNK_OPERATIONS, 'unknown operation `{}`'.format(json_operation['__operation'])

				operation_class = DATA_CHUNK_OPERATIONS[json_operation['__operation']]
				operation = operation_class(json_operation)

				operations.append(operation)

		except Exception as exception:
			#TODO: log invalid json_operation

			return False

		transaction = DataTransaction(json_operations)

		try:
			transaction.current_operation_id = 0

			for operation in operations:
				operation.process(transaction)

				transaction.current_operation_id += 1

		except DataTransaction.DataException as exception:
			i = 0

			for operation in operations:
				if i == exception.operation_id:
					operation.failure(str(exception))

				else:
					operation.failure('an other operation has failed')

				i += 1

			return False

		for operation in operations:
			operation.success()

		transaction.commit()

		return True


# -------------------------------------------------------------- DATA OPERATIONS




# ---------------------------------------------------------------- RPC INTERFACE

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

		self.logger = log.get_logger("serverDataLogs.log",self.testing_profile)

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
		self.logger.info("chunk creation : title={}, owner={}, content={}, append_enabled={}".format(title,owner,content,append_enabled))
		try:
			chunk = DataChunk.objects.get(title=title)
			self.logger.info("chunk creation : chunk {} already existing".format(title))
		except mongoengine.DoesNotExist as e:
			chunk = DataChunk(title=title,owner=owner,content=content,append_enabled=append_enabled).save()
			self.logger.info("chunk creation : new chunk created")


	def xmlrpc_write_chunk(self, title, user, content):

		chunk = None
		self.logger.info("chunk modification : title={}".format(title))
		try:
			chunk = DataChunk.objects.get(title=title)
			self.logger.info("chunk modification : chunk found")
		except mongoengine.DoesNotExist as e:
			self.logger.error("chunk modification : chunk not found, error message={}".format(e))
			return

		if chunk.owner == user:
			self.logger.info("chunk modification : chunk modified, right owner={}".format(user))
			chunk.content = content
			chunk.save()

	def xmlrpc_read_chunk(self, title):

		chunk = None
		self.logger.info("getting chunk : title={}".format(title))

		try:
			chunk = DataChunk.objects.get(title=title)
			self.logger.info("getting chunk : chunk found, content={}".format(chunk.content))
			return json.dumps(chunk.content)
		except mongoengine.DoesNotExist as e:
			self.logger.error("getting chunk : chunk not found, error message={}".format(e))
			return None

	def xmlrpc_append_content(self, title, content):

		chunk = None
		self.logger.info("appending content to chunk : title={}, content={}".format(title,content))

		try:
			chunk = DataChunk.objects.get(title=title)
			self.logger.info("appending content to chunk : chunk found, current content={}".format(chunk.content))
		except mongoengine.DoesNotExist as e:
			self.logger.error("appending content to chunk : chunk not found, error message={}".format(e))
			return

		if chunk.append_enabled:
			self.logger.info("appending content to chunk : content appended to chunk, new content={},{}".format(chunk.content,content))
			chunk.content.append(content)
			chunk.save()
		else:
			self.logger.error("appending content to chunk : content cannot be appended to the chunk")

	def xmlrpc_delete_chunk(self, title, owner):

		chunk = None
		self.logger.info("chunk deletion : title={}".format(title))

		try:
			chunk = DataChunk.objects.get(title=title)
			self.logger.info("chunk deletion : chunk found")
		except mongoengine.DoesNotExist as e:
			self.logger.error("chunk deletion : chunk not found, error message={}".format(e))
			return

		if chunk.owner == owner:
			self.logger.info("chunk deletion : chunk deleted, right owner={}".format(owner))
			chunk.delete()
		else:
			self.logger.error("chunk deletion : user {} doesn't have the right to delete chunk".format(owner))


# ------------------------------------------------------------- MAIN ENTRY POINT

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
