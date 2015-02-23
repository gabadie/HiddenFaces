import mongoengine
import json

from servdata import DataManager, DataChunk

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

	content_post_user1 = json.loads(serverRPC.xmlrpc_read_chunk('post1'))
	content_private_user2 = json.loads(serverRPC.xmlrpc_read_chunk('private_user2'))

	assert len(DataChunk.objects) == 3
	assert len(content_post_user1) == 2
	assert len(content_private_user2) == 3

if __name__ == '__main__':
	test_chunk_creation()
