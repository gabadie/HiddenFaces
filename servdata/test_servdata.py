import mongoengine
import json

from servdata import DataManager, DataChunk, DataOperation, DataTransaction, data_chunk_op

# Connecting to a test db
db_name = 'test_db'


# -------------------------------------------------- TEST TRANSACTIONS MECHANISM

@data_chunk_op('/testing/type_checkin')
class OpTestTypeChecking(DataOperation):
	def __init__(self, json_operation):
		pass

	def process(self, transaction):
		assert isinstance(transaction, DataTransaction)

	def success(self):
		pass

	def failure(self, reason):
		pass
		assert isinstance(reason, str)

@data_chunk_op('/testing/order')
class OpTestOrder(DataOperation):
	current_id = 0

	def __init__(self, json_operation):
		self.json_operation = json_operation

		assert OpTestOrder.current_id == self.json_operation['validate']
		OpTestOrder.current_id += 1

	def process(self, transaction):
		assert OpTestOrder.current_id == self.json_operation['process']
		OpTestOrder.current_id += 1

	def success(self):
		assert OpTestOrder.current_id == self.json_operation['success']
		assert self.json_operation['failure'] == None
		OpTestOrder.current_id += 1

	def failure(self, reason):
		assert OpTestOrder.current_id == self.json_operation['failure']
		assert self.json_operation['success'] == None
		OpTestOrder.current_id += 1

	@staticmethod
	def reset():
		OpTestOrder.current_id = 0

@data_chunk_op('/testing/validation_failure')
class OpTestValidationFailure(DataOperation):
	def __init__(self, json_operation):
		assert False

	def process(self, transaction):
		pass

	def success(self):
		pass

	def failure(self, reason):
		pass

@data_chunk_op('/testing/process_failure')
class OpTestProcessFailure(DataOperation):
	ERROR_MSH='hello world'

	def __init__(self, json_operation):
		pass

	def process(self, transaction):
		transaction.failure(OpTestProcessFailure.ERROR_MSH)

	def success(self):
		pass

	def failure(self, reason):
		assert reason == OpTestProcessFailure.ERROR_MSH

@data_chunk_op('/testing/foreign_failure')
class OpTestForeignFailure(DataOperation):
	def __init__(self, json_operation):
		pass

	def process(self, transaction):
		pass

	def success(self):
		pass

	def failure(self, reason):
		assert reason == 'an other operation has failed'


def test_transaction_sanity():
	json_operations = [
		{
			'__operation': '/testing/type_checkin'
		}
	]

	assert DataTransaction.is_success(DataTransaction.process(json_operations))


def test_empty_transaction():
	assert DataTransaction.process([]) == False


def test_transaction_order():
	json_operations = [
		{
			'__operation': '/testing/order',
			'validate': 0,
			'process': 3,
			'success': 6,
			'failure': None
		},
		{
			'__operation': '/testing/order',
			'validate': 1,
			'process': 4,
			'success': 7,
			'failure': None
		},
		{
			'__operation': '/testing/order',
			'validate': 2,
			'process': 5,
			'success': 8,
			'failure': None
		}
	]

	OpTestOrder.reset()

	assert DataTransaction.is_success(DataTransaction.process(json_operations))
	assert OpTestOrder.current_id == 9

def test_transaction_validation_failure():
	json_operations = [
		{
			'__operation': '/testing/order',
			'validate': 0,
			'process': None,
			'success': None,
			'failure': None
		},
		{
			'__operation': '/testing/validation_failure'
		},
		{
			'__operation': '/testing/order',
			'validate': None,
			'process': None,
			'success': None,
			'failure': None
		}
	]

	OpTestOrder.reset()

	assert DataTransaction.process(json_operations) == False
	assert OpTestOrder.current_id == 1

def test_transaction_process_failure():
	json_operations = [
		{
			'__operation': '/testing/order',
			'validate': 0,
			'process': 2,
			'success': None,
			'failure': 3
		},
		{
			'__operation': '/testing/foreign_failure',
		},
		{
			'__operation': '/testing/process_failure'
		},
		{
			'__operation': '/testing/foreign_failure',
		},
		{
			'__operation': '/testing/order',
			'validate': 1,
			'process': None,
			'success': None,
			'failure': 4
		},
		{
			'__operation': '/testing/foreign_failure',
		}
	]

	OpTestOrder.reset()

	assert DataTransaction.process(json_operations) != False
	assert not DataTransaction.is_success(DataTransaction.process(json_operations))
	assert OpTestOrder.current_id == 5


# ------------------------------------------------- TEST TRANSACTIONS OPERATIONS

def test_create_data_chunk():
	json_operations = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk',
			'content': 			['hello', 'world'],
			'owner': 			'my_user',
			'append_enabled': 	False
		}
	]

	serverRPC = DataManager(db_name)
	serverRPC.db.drop_database(db_name)

	assert len(DataChunk.objects) == 0
	assert DataTransaction.is_success(DataTransaction.process(json_operations))
	assert len(DataChunk.objects) == 1
	assert len(json.loads(serverRPC.xmlrpc_read_chunk('my_chunk'))) == len(json_operations[0]['content'])

def test_create_duplicated_data_chunk():
	json_operations0 = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk',
			'content': 			['hello', 'world'],
			'owner': 			'my_user',
			'append_enabled': 	False
		}
	]

	json_operations1 = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk',
			'content': 			['this', 'is', 'cool'],
			'owner': 			'my_user',
			'append_enabled': 	False
		}
	]

	serverRPC = DataManager(db_name)
	serverRPC.db.drop_database(db_name)

	assert len(DataChunk.objects) == 0
	assert DataTransaction.is_success(DataTransaction.process(json_operations0))
	assert len(DataChunk.objects) == 1
	assert not DataTransaction.is_success(DataTransaction.process(json_operations1))
	assert len(DataChunk.objects) == 1
	assert len(json.loads(serverRPC.xmlrpc_read_chunk('my_chunk'))) == len(json_operations0[0]['content'])


def test_write_data_chunk():
	json_operations0 = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk',
			'content': 			['hello', 'world'],
			'owner': 			'my_user',
			'append_enabled': 	False
		}
	]

	json_operations1 = [
		{
			'__operation': 		'/write_data_chunk',
			'title': 			json_operations0[0]['title'],
			'content': 			['my', 'second', 'post'],
			'user': 			json_operations0[0]['owner']
		}
	]

	serverRPC = DataManager(db_name)
	serverRPC.db.drop_database(db_name)

	assert DataTransaction.is_success(DataTransaction.process(json_operations0))
	assert DataTransaction.is_success(DataTransaction.process(json_operations1))
	assert len(json.loads(serverRPC.xmlrpc_read_chunk('my_chunk'))) == len(json_operations1[0]['content'])


def test_invalid_write_data_chunk():
	json_operations0 = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk',
			'content': 			['hello', 'world'],
			'owner': 			'my_user',
			'append_enabled': 	False
		}
	]

	json_operations1 = [
		{
			'__operation': 		'/write_data_chunk',
			'title': 			json_operations0[0]['title'],
			'content': 			['my', 'post', 'is', 'better'],
			'user': 			'an other user'
		}
	]

	serverRPC = DataManager(db_name)
	serverRPC.db.drop_database(db_name)

	assert DataTransaction.is_success(DataTransaction.process(json_operations0))
	assert not DataTransaction.is_success(DataTransaction.process(json_operations1))
	assert len(json.loads(serverRPC.xmlrpc_read_chunk('my_chunk'))) == len(json_operations0[0]['content'])


def test_write_data_same_transaction_chunk():
	json_operations0 = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk',
			'content': 			['hello', 'world'],
			'owner': 			'my_user',
			'append_enabled': 	False
		},
		{
			'__operation': 		'/write_data_chunk',
			'title': 			'my_chunk',
			'content': 			['my', 'post', 'is', 'better'],
			'user': 			'my_user'
		}
	]

	serverRPC = DataManager(db_name)
	serverRPC.db.drop_database(db_name)

	assert DataTransaction.is_success(DataTransaction.process(json_operations0))
	assert len(json.loads(serverRPC.xmlrpc_read_chunk('my_chunk'))) == len(json_operations0[1]['content'])


def test_extend_data_chunk():
	json_operations0 = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk',
			'content': 			['hello', 'world'],
			'owner': 			'my_user',
			'append_enabled': 	False
		}
	]

	json_operations1 = [
		{
			'__operation': 		'/extend_data_chunk',
			'title': 			json_operations0[0]['title'],
			'content': 			['my', 'second'],
			'user': 			json_operations0[0]['owner']
		}
	]

	json_operations2 = [
		{
			'__operation': 		'/extend_data_chunk',
			'title': 			json_operations0[0]['title'],
			'content': 			['my', 'post', 'is', 'better'],
			'user': 			'an other user'
		}
	]

	json_operations3 = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk2',
			'content': 			['hello', 'world'],
			'owner': 			json_operations0[0]['owner'],
			'append_enabled': 	False
		},
		{
			'__operation': 		'/extend_data_chunk',
			'title': 			'my_chunk2',
			'content': 			['my', 'second', 'post'],
			'user': 			json_operations0[0]['owner']
		}
	]

	json_operations4 = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk3',
			'content': 			['hello', 'world'],
			'owner': 			json_operations0[0]['owner'],
			'append_enabled': 	True
		},
		{
			'__operation': 		'/extend_data_chunk',
			'title': 			'my_chunk3',
			'content': 			['my', 'second', 'post'],
			'user': 			'an other user'
		}
	]

	serverRPC = DataManager(db_name)
	serverRPC.db.drop_database(db_name)

	assert DataTransaction.is_success(DataTransaction.process(json_operations0))
	assert DataTransaction.is_success(DataTransaction.process(json_operations1))
	assert len(json.loads(serverRPC.xmlrpc_read_chunk('my_chunk'))) == 4

	assert not DataTransaction.is_success(DataTransaction.process(json_operations2))
	assert len(json.loads(serverRPC.xmlrpc_read_chunk('my_chunk'))) == 4

	assert DataTransaction.is_success(DataTransaction.process(json_operations3))
	assert len(json.loads(serverRPC.xmlrpc_read_chunk('my_chunk2'))) == 5

	assert DataTransaction.is_success(DataTransaction.process(json_operations4))
	assert len(json.loads(serverRPC.xmlrpc_read_chunk('my_chunk3'))) == 5


def test_delete_existing_data_chunk():
	json_operations0 = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk',
			'content': 			['hello', 'world'],
			'owner': 			'my_user',
			'append_enabled': 	False
		}
	]

	json_operations1 = [
		{
			'__operation': 		'/delete_data_chunk',
			'title': 			'my_chunk',
			'user': 			'my_user',
		}
	]

	serverRPC = DataManager(db_name)
	serverRPC.db.drop_database(db_name)

	assert DataTransaction.is_success(DataTransaction.process(json_operations0))
	assert DataTransaction.is_success(DataTransaction.process(json_operations1))
	assert len(DataChunk.objects) == 0


def test_delete_no_existing_data_chunk():
	json_operations0 = [
		{
			'__operation': 		'/delete_data_chunk',
			'title': 			'my_chunk',
			'user': 			'my_user',
		}
	]

	serverRPC = DataManager(db_name)
	serverRPC.db.drop_database(db_name)

	assert not DataTransaction.is_success(DataTransaction.process(json_operations0))
	assert len(DataChunk.objects) == 0


def test_create_delete_data_chunk():
	json_operations0 = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk',
			'content': 			['hello', 'world'],
			'owner': 			'my_user',
			'append_enabled': 	False
		},
		{
			'__operation': 		'/delete_data_chunk',
			'title': 			'my_chunk',
			'user': 			'my_user',
		}
	]

	serverRPC = DataManager(db_name)
	serverRPC.db.drop_database(db_name)

	assert DataTransaction.is_success(DataTransaction.process(json_operations0))
	assert len(DataChunk.objects) == 0


def test_create_delete_create_data_chunk():
	json_operations0 = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk',
			'content': 			['hello', 'world'],
			'owner': 			'my_user',
			'append_enabled': 	False
		},
		{
			'__operation': 		'/delete_data_chunk',
			'title': 			'my_chunk',
			'user': 			'my_user',
		},
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk',
			'content': 			['this', 'is', 'greate'],
			'owner': 			'my_user2',
			'append_enabled': 	False
		},
	]

	serverRPC = DataManager(db_name)
	serverRPC.db.drop_database(db_name)

	assert DataTransaction.is_success(DataTransaction.process(json_operations0))
	assert len(DataChunk.objects) == 1
	assert len(json.loads(serverRPC.xmlrpc_read_chunk('my_chunk'))) == len(json_operations0[2]['content'])


def test_create_delete_delete_data_chunk():
	json_operations0 = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk',
			'content': 			['hello', 'world'],
			'owner': 			'my_user',
			'append_enabled': 	False
		},
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk2',
			'content': 			['hello', 'world'],
			'owner': 			'my_user',
			'append_enabled': 	False
		},
		{
			'__operation': 		'/delete_data_chunk',
			'title': 			'my_chunk',
			'user': 			'my_user',
		},
		{
			'__operation': 		'/delete_data_chunk',
			'title': 			'my_chunk',
			'user': 			'my_user',
		}
	]

	serverRPC = DataManager(db_name)
	serverRPC.db.drop_database(db_name)

	assert not DataTransaction.is_success(DataTransaction.process(json_operations0))
	assert len(DataChunk.objects) == 0


def test_denied_delete_data_chunk():
	json_operations0 = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk',
			'content': 			['hello', 'world'],
			'owner': 			'my_user',
			'append_enabled': 	False
		}
	]

	json_operations1 = [
		{
			'__operation': 		'/delete_data_chunk',
			'title': 			'my_chunk',
			'user': 			'my_user2',
		},
	]

	serverRPC = DataManager(db_name)
	serverRPC.db.drop_database(db_name)

	assert DataTransaction.is_success(DataTransaction.process(json_operations0))
	assert not DataTransaction.is_success(DataTransaction.process(json_operations1))
	assert len(DataChunk.objects) == 1

def test_get_data_chunk():
	json_operations0 = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk',
			'content': 			['hello', 'world'],
			'owner': 			'my_user',
			'append_enabled': 	False
		},
		{
			'__operation': 		'/get_data_chunk',
			'title': 			'my_chunk'
		}
	]

	serverRPC = DataManager(db_name)
	serverRPC.db.drop_database(db_name)

	r = DataTransaction.process(json_operations0)
	assert DataTransaction.is_success(r)
	assert len(r['return'][1]) == len(json_operations0[0]['content'])

def test_get_write_data_chunk():
	json_operations0 = [
		{
			'__operation': 		'/create_data_chunk',
			'title': 			'my_chunk',
			'content': 			['hello', 'world'],
			'owner': 			'my_user',
			'append_enabled': 	False
		}
	]

	json_operations1 = [
		{
			'__operation': 		'/get_data_chunk',
			'title': 			'my_chunk'
		},
		{
			'__operation': 		'/write_data_chunk',
			'title': 			'my_chunk',
			'content': 			[],
			'user': 			'my_user'
		}
	]

	serverRPC = DataManager(db_name)
	serverRPC.db.drop_database(db_name)

	assert DataTransaction.is_success(DataTransaction.process(json_operations0))

	r = DataTransaction.process(json_operations1)
	assert DataTransaction.is_success(r)
	assert len(r['return'][1]) == len(json_operations0[0]['content'])

if __name__ == '__main__':
	test_chunk_creation()
