import mongoengine
import json

from servdata import DataManager, DataChunk, DataOperation, DataTransaction, data_chunk_op

# Connecting to a test db
db_name = 'test_db'

def test_chunk_creation():

	serverRPC = DataManager(db_name)
	serverRPC.db.drop_database(db_name)

	#users
	serverRPC.xmlrpc_new_chunk("private_user1","user1",[],False)
	serverRPC.xmlrpc_new_chunk("private_user2","user2",[],False)
	user_fake = serverRPC.xmlrpc_new_chunk("private_user2","user2",[],False)

	#posts
	serverRPC.xmlrpc_new_chunk("post1","user1",["""My heart leaps up when I behold
											        A rainbow in the sky:
											        So was it when my life began;
											        So is it now I am a man;
											        So be it when I shall grow old,
											        Or let me die!
											        The Child is father of the Man;
											        I could wish my days to be
											        Bound each to each by natural piety."""],True)
	serverRPC.xmlrpc_new_chunk("post2","user1",["oops"],True)

	#modifications
	serverRPC.xmlrpc_write_chunk('post1','user2',["a","b","c"])
	serverRPC.xmlrpc_write_chunk('private_user2','user2',["name","birthday","interests"])

	serverRPC.xmlrpc_append_content("post1", 'user2: amazing <3')
	serverRPC.xmlrpc_append_content("private_user1", 'user2: amazing <3')

	serverRPC.xmlrpc_delete_chunk('post1',"user2")
	serverRPC.xmlrpc_delete_chunk('post2',"user1")

	content_post_user1 = serverRPC.xmlrpc_read_chunk('post1')
	content_private_user2 = serverRPC.xmlrpc_read_chunk('private_user2')

	assert len(DataChunk.objects) == 3
	assert len(content_post_user1) == 2
	assert len(content_private_user2) == 3


# -------------------------------------------------- TEST TRANSACTIONS MECHANISM

@data_chunk_op('/testing/type_checkin')
class OpTestTypeChecking(DataOperation):
	def validate(self, json_operation):
		pass #assert isinstance(json_operation, dict)

	def process(self, json_operation, transaction):
		assert isinstance(json_operation, dict)
		assert isinstance(transaction, DataTransaction)

	def success(self, json_operation):
		assert isinstance(json_operation, dict)

	def failure(self, json_operation, reason):
		assert isinstance(json_operation, dict)
		assert isinstance(reason, str)

@data_chunk_op('/testing/order')
class OpTestOrder(DataOperation):
	current_id = 0

	def validate(self, json_operation):
		assert OpTestOrder.current_id == json_operation['validate']
		OpTestOrder.current_id += 1

	def process(self, json_operation, transaction):
		assert OpTestOrder.current_id == json_operation['process']
		OpTestOrder.current_id += 1

	def success(self, json_operation):
		assert OpTestOrder.current_id == json_operation['success']
		assert json_operation['failure'] == None
		OpTestOrder.current_id += 1

	def failure(self, json_operation, reason):
		assert OpTestOrder.current_id == json_operation['failure']
		assert json_operation['success'] == None
		OpTestOrder.current_id += 1

	@staticmethod
	def reset():
		OpTestOrder.current_id = 0

@data_chunk_op('/testing/validation_failure')
class OpTestValidationFailure(DataOperation):
	def validate(self, json_operation):
		assert False

	def process(self, json_operation, transaction):
		pass

	def success(self, json_operation):
		pass

	def failure(self, json_operation, reason):
		pass

@data_chunk_op('/testing/process_failure')
class OpTestProcessFailure(DataOperation):
	ERROR_MSH='hello world'

	def validate(self, json_operation):
		pass

	def process(self, json_operation, transaction):
		transaction.failure(OpTestProcessFailure.ERROR_MSH)

	def success(self, json_operation):
		pass

	def failure(self, json_operation, reason):
		assert reason == OpTestProcessFailure.ERROR_MSH

@data_chunk_op('/testing/foreign_failure')
class OpTestForeignFailure(DataOperation):
	def validate(self, json_operation):
		pass

	def process(self, json_operation, transaction):
		pass

	def success(self, json_operation):
		pass

	def failure(self, json_operation, reason):
		assert reason == 'an other operation has failed'


def test_transaction_sanity():
	json_operations = [
		{
			'__operation': '/testing/type_checkin'
		}
	]

	assert DataTransaction.process(json_operations) == True

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

	assert DataTransaction.process(json_operations) == True
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

	assert DataTransaction.process(json_operations) == False
	assert OpTestOrder.current_id == 5


if __name__ == '__main__':
	test_chunk_creation()
