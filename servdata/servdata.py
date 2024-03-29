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
		if self.logger:
			self.logger.info('{} successed'.format(self.log_summary()))

	def failure(self, raison):
		""" Method called if at least one operation has failed
		"""
		if self.logger:
			self.logger.info('{} failed ({})'.format(
				self.log_summary(),
				raison
			))

	def log_summary(self):
		""" Method called if the default failure and success callbacks
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
		self.data_chunk_operation = {}
		self.json_operations = json_operations
		self.current_operation_id = None
		self.status = 'ok'

	def get_data_chunk(self, title):
		""" Access database
		"""
		data_chunk = None

		if title in self.data_chunk_cache:
			if self.data_chunk_operation[title] in ['delete', 'ignore']:
				self.failure('data chunk `{}` has been deleted earlier in this transaction'.format(title))

			data_chunk = self.data_chunk_cache[title]

		else:
			try:
				data_chunk = DataChunk.objects.get(title=title)

			except:
				self.failure('unknown data chunk `{}`'.format(title))

			self.data_chunk_cache[title] = data_chunk
			self.data_chunk_operation[title] = 'save'

		assert data_chunk != None
		assert isinstance(data_chunk, DataChunk)

		return data_chunk

	def create_data_chunk(self, title, content, owner, append_enabled):
		""" Create data chunk
		"""
		data_chunk = None

		if title in self.data_chunk_cache:
			if self.data_chunk_operation[title] == 'save':
				self.failure('data chunk `{}` already exists'.format(title))

			elif self.data_chunk_operation[title] == 'create':
				self.failure('data chunk `{}` has already been created earlier in this transaction'.format(title))

			elif self.data_chunk_operation[title] == 'delete':
				data_chunk = self.data_chunk_cache[title]
				self.data_chunk_operation[title] = 'save'

			elif self.data_chunk_operation[title] == 'ignore':
				data_chunk = self.data_chunk_cache[title]
				self.data_chunk_operation[title] = 'create'

			else:
				assert False, 'unknwon data chunk operation'

			assert data_chunk.title == title
			data_chunk.content = content
			data_chunk.owner = owner
			data_chunk.append_enabled = append_enabled

		else:
			try:
				data_chunk = DataChunk.objects.get(title=title)

			except:
				pass

			else:
				self.failure('data chunk `{}` already exists'.format(title))

			data_chunk = DataChunk(
				title=title,
				owner=owner,
				content=content,
				append_enabled=append_enabled
			)
			self.data_chunk_cache[title] = data_chunk
			self.data_chunk_operation[title] = 'create'

		assert data_chunk != None

		return data_chunk

	def delete_data_chunk(self, title):
		""" Delete data chunk
		"""
		if title not in self.data_chunk_cache:
			self.get_data_chunk(title)

			assert self.data_chunk_operation[title] == 'save'
			self.data_chunk_operation[title] = 'delete'

			return

		if self.data_chunk_operation[title] == 'save':
			self.data_chunk_operation[title] = 'delete'

		elif self.data_chunk_operation[title] == 'create':
			self.data_chunk_operation[title] = 'ignore'

		elif self.data_chunk_operation[title] in ['delete', 'ignore']:
			self.failure('data chunk `{}` has already been deleted in this transaction'.format(title))

		else:
			assert False, 'unknwon data chunk operation'

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
			operation = self.data_chunk_operation[data_chunk.title]

			if operation == 'ignore':
				continue

			elif operation == 'delete':
				data_chunk.delete()

			elif operation == 'save' or operation == 'create':
				data_chunk.save()

			else:
				assert False, 'unknwon data chunk operation'

	@staticmethod
	def process(json_operations, logger=None):
		""" json_operation = [
			{
				'__operation': '/create_data_chunk'
			}
		]
		"""
		operations = list()

		try:
			assert isinstance(json_operations, list)

			if len(json_operations) == 0:
				logger.info('transaction doesn\'t have any operations')
				return False

			for json_operation in json_operations:
				assert isinstance(json_operation, dict)
				assert '__operation' in json_operation, 'missing __operation'
				assert json_operation['__operation'] in DATA_CHUNK_OPERATIONS, 'unknown operation `{}`'.format(json_operation['__operation'])

				operation_class = DATA_CHUNK_OPERATIONS[json_operation['__operation']]
				operation = operation_class(json_operation)
				operation.logger = logger

				operations.append(operation)

		except Exception as exception:
			if logger:
				logger.info('failed to parse transaction\'s json operations')

			return False

		transaction = DataTransaction(json_operations)
		transaction_result = {
			'return': [None for e in json_operations],
			'status': ['non_executed' for e in json_operations]
		}

		try:
			transaction.current_operation_id = 0

			for operation in operations:
				operation_return = operation.process(transaction)

				if operation_return == None:
					operation_return = 'ok'

				transaction_result['status'][transaction.current_operation_id] = 'success'
				transaction_result['return'][transaction.current_operation_id] = operation_return

				transaction.current_operation_id += 1

		except DataTransaction.DataException as exception:
			i = 0

			for operation in operations:
				if i == exception.operation_id:
					operation.failure(str(exception))
					transaction_result['status'][i] = str(exception)

				else:
					operation.failure('an other operation has failed')
					transaction_result['status'][i] = 'discarded'

				transaction_result['return'][i] = None

				i += 1

		else:
			for operation in operations:
				operation.success()

			transaction.commit()

			transaction_result['status'] = ['commited' for e in json_operations]

			assert DataTransaction.is_success(transaction_result)

		return transaction_result

	@staticmethod
	def is_success(transaction_result):
		""" Checks if the transaction_result is a success
		"""
		if transaction_result == False:
			return False

		assert isinstance(transaction_result, dict)
		assert len(transaction_result['status']) > 0
		assert len(transaction_result['status']) == len(transaction_result['return'])

		for operation_status in transaction_result['status']:
			assert isinstance(operation_status, str)

			if operation_status != 'commited':
				return False

		return True


# -------------------------------------------------------------- DATA OPERATIONS

def validate(json_operation, key, value_type):
	assert key in json_operation
	assert isinstance(json_operation[key], value_type)
	return json_operation[key]

def validate_content(json_operation):
	assert 'content' in json_operation
	assert isinstance(json_operation['content'], list)
	for s in json_operation['content']:
		assert isinstance(s, str)

	return json_operation['content']

@data_chunk_op('/create_data_chunk')
class CreateDataChunk(DataOperation):
	""" json_operation = {
		'title': 			'name',
		'content': 			['hello', 'world'],
		'owner': 			'my_user',
		'append_enabled': 	False
	}
	"""

	def __init__(self, json_operation):
		self.title = validate(json_operation, 'title', str)
		self.content = validate_content(json_operation)
		self.owner = validate(json_operation, 'owner', str)
		self.append_enabled = validate(json_operation, 'append_enabled', bool)

	def process(self, transaction):
		transaction.create_data_chunk(
			title=self.title,
			content=self.content,
			owner=self.owner,
			append_enabled=self.append_enabled
		)

	def log_summary(self):
		return "create_data_chunk(title={}, owner={}, append_enabled={})".format(
			self.title,
			self.owner,
			self.append_enabled
		)

@data_chunk_op('/write_data_chunk')
class WriteDataChunk(DataOperation):
	""" json_operation = {
		'title': 			'name',
		'content': 			['hello', 'world'],
		'user': 			'my_user'
	}
	"""

	def __init__(self, json_operation):
		self.title = validate(json_operation, 'title', str)
		self.content = validate_content(json_operation)
		self.user = validate(json_operation, 'user', str)

	def process(self, transaction):
		chunk = transaction.get_data_chunk(
			title=self.title
		)

		if self.user != chunk.owner:
			transaction.failure('permission denied')

		chunk.content = self.content

	def log_summary(self):
		return "write_data_chunk(title={}, user={})".format(
			self.title,
			self.user
		)

@data_chunk_op('/get_data_chunk')
class GetDataChunk(DataOperation):
	""" json_operation = {
		'title': 			'name'
	}
	"""

	def __init__(self, json_operation):
		self.title = validate(json_operation, 'title', str)

	def process(self, transaction):
		chunk = transaction.get_data_chunk(
			title=self.title
		)

		return [str(s) for s in chunk.content]

	def log_summary(self):
		return "get_data_chunk(title={})".format(
			self.title
		)

@data_chunk_op('/extend_data_chunk')
class ExtendDataChunk(DataOperation):
	""" json_operation = {
		'title': 			'name',
		'content': 			['hello', 'world'],
		'user': 			'my_user'
	}
	"""

	def __init__(self, json_operation):
		self.title = validate(json_operation, 'title', str)
		self.content = validate_content(json_operation)
		self.user = validate(json_operation, 'user', str)

	def process(self, transaction):
		chunk = transaction.get_data_chunk(
			title=self.title
		)

		if self.user == chunk.owner:
			pass

		elif chunk.append_enabled:
			pass

		else:
			transaction.failure('permission denied')

		chunk.content.extend(self.content)

	def log_summary(self):
		return "extend_data_chunk(title={}, user={})".format(
			self.title,
			self.user
		)

@data_chunk_op('/delete_data_chunk')
class DeleteDataChunk(DataOperation):
	""" json_operation = {
		'title': 			'name',
		'user': 			'my_user'
	}
	"""

	def __init__(self, json_operation):
		self.title = validate(json_operation, 'title', str)
		self.user = validate(json_operation, 'user', str)

	def process(self, transaction):
		chunk = transaction.get_data_chunk(
			title=self.title
		)

		if self.user != chunk.owner:
			transaction.failure('permission denied')

		transaction.delete_data_chunk(title=self.title)

	def log_summary(self):
		return "delete_data_chunk(title={}, user={})".format(
			self.title,
			self.user
		)


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

	def xmlrpc_read_chunk(self, title):
		""" Reads a data chunk from database
		"""
		self.logger.info("getting chunk : title={}".format(title))

		try:
			chunk = DataChunk.objects.get(title=title)
			self.logger.info("getting chunk : chunk found")
			return json.dumps(chunk.content)
		except mongoengine.DoesNotExist as e:
			self.logger.error("getting chunk : chunk not found, error message={}".format(e))
			return None

	def xmlrpc_data_chunk_transaction(self, json_operations):
		""" Processes a data chunk transactions on the database
		"""
		return DataTransaction.process(json_operations, self.logger)


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
	reactor.listenTCP(7090, server.Site(data_manager))
	reactor.run()
