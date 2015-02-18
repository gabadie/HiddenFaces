
var test_hf_com = {};

test_hf_com.test1 = function()
{
    test_utils.assert(false, 'test 1');
    test_utils.assert(false, 'test 2');
    test_utils.assert(true, 'test 3');
    test_utils.assert(false, 'test 4');
}

test_hf_com.test_create_data_chunk = function()
{
	hf_com.create_data_chunk("private_user1", "user1", "", [], false, function(json_message){
		//alert(JSON.stringify(json_message["status"]));
        test_utils.assert(json_message["status"] == "ok", json_message);
    });
} 

test_hf_com.test_data_chunk_operations = function()
{
	//create users
	hf_com.create_data_chunk("private_user1", "user1", "", [], false, function(json_message){
        test_utils.assert(json_message["status"] == "ok", json_message);
    });
    hf_com.create_data_chunk("private_user2","user2", "", [], false, function(json_message){
        test_utils.assert(json_message["status"] == "ok", json_message);
    });

    //create posts
    hf_com.create_data_chunk("post1","user1","",["My heart leaps up when I behold"],false, function(json_message){
        test_utils.assert(json_message["status"] == "ok", json_message);
    });
    hf_com.create_data_chunk("post2","user1","",["oops"],true, function(json_message){
        test_utils.assert(json_message["status"] == "ok", json_message);
    });

    //modify data chunk
    hf_com.write_data_chunk("private_user2","user2","",["name","birthday","interests"],function(json_message){
        test_utils.assert(json_message["status"] == "ok", json_message);
    });
    hf_com.append_data_chunk("post1", "", "user2: amazing <3", function(json_message){
        test_utils.assert(json_message["status"] == "ok", json_message);
    });
    hf_com.append_data_chunk("private_user1", "", "user2: amazing <3", function(json_message){
        test_utils.assert(json_message["status"] == "ok", json_message);
    });
    
    //read data chunks
    hf_com.get_data_chunk("private_user1", "", function(json_message){
        test_utils.assert(json_message["chunk_content"].length == 0, json_message);
    });
    hf_com.get_data_chunk("private_user2", "", function(json_message){
        test_utils.assert(json_message["chunk_content"].length == 3, json_message);
    });
    hf_com.get_data_chunk("post1", "", function(json_message){
        test_utils.assert(json_message["chunk_content"].length == 2, json_message);
    });
} 

test_hf_com.main = function()
{
    test_utils.run(test_hf_com.test1, 'test_hf_com.test1');
    test_utils.run(test_hf_com.test_create_data_chunk, 'test_hf_com.test_create_data_chunk');
    test_utils.run(test_hf_com.test_data_chunk_operations, 'test_hf_com.test_data_chunk_operations');
}
