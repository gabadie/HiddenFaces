
var test_hf_com = {};

setup_data_base = function()
{
    //create users
    hf_com.create_data_chunk("private_user1", "user1", "", [], false, function(json_message){
        test_utils.assert(json_message["status"] == "ok", "test adding private_user1");
    });
    hf_com.create_data_chunk("private_user2","user2", "", [], false, function(json_message){
        test_utils.assert(json_message["status"] == "ok", "test adding private_user2");
    });

    //create posts
    hf_com.create_data_chunk("post1","user1","",["My heart leaps up when I behold"],true, function(json_message){
        test_utils.assert(json_message["status"] == "ok", "test adding post1");
    });
    hf_com.create_data_chunk("post2","user1","",["oops"],true, function(json_message){
        test_utils.assert(json_message["status"] == "ok", "test adding post2");
    });
}

test_hf_com.test_create_data_chunk = function()
{
    var user = hf.hash('user');
    var chunk_name = hf.hash('chunk_name');
    var chunk_content = ['hello ', 'world!', 'my name is'];

    hf_com.create_data_chunk(chunk_name, user, "", chunk_content, false, function(json_message){
        test_utils.assert(json_message["status"] == "ok", "test creating chunk");
    });

    hf_com.get_data_chunk(chunk_name, "", function(json_message){
        test_utils.assert(json_message["status"] == "ok", "test getting chunk");
        test_utils.assert(
            json_message["chunk_content"].length == chunk_content.length,
            "unmatching chunk_content length"
        );
        for (var i = 0; i < chunk_content.length; i++)
        {
            test_utils.assert(
                json_message["chunk_content"][i] == chunk_content[i],
                "chunk_content[" + i + "] corrupted"
            );
        }
    });

    test_utils.assert_success(3 + chunk_content.length);
}

test_hf_com.test_data_chunk_modifications = function()
{
    setup_data_base();

    //modify data chunk
    hf_com.write_data_chunk("private_user2","user2","",["name","birthday","interests"],function(json_message){
        test_utils.assert(json_message["status"] == "ok", "test overwrite private_user2");
    });
    hf_com.append_data_chunk("post1", "", "user2: amazing <3", function(json_message){
        test_utils.assert(json_message["status"] == "ok", "test append to post1");
    });
    hf_com.append_data_chunk("private_user1", "", "user2: amazing <3", function(json_message){
        test_utils.assert(json_message["status"] == "ok", "test append to private_user1");
    });

    //read data chunks
    hf_com.get_data_chunk("private_user1", "", function(json_message){
        test_utils.assert(json_message["chunk_content"].length == 0, "test get content private_user1");
    });
    hf_com.get_data_chunk("private_user2", "", function(json_message){
        test_utils.assert(json_message["chunk_content"].length == 3, "test get content private_user2");
    });
    hf_com.get_data_chunk("post1", "", function(json_message){
        test_utils.assert(json_message["chunk_content"].length == 2, "test get content post1");
    });
}

test_hf_com.test_data_chunk_delections = function()
{
    setup_data_base();

    //delete data chunks
    hf_com.delete_data_chunk("post1","user2",null);
    hf_com.get_data_chunk("post1", "", function(json_message){
        test_utils.assert(json_message["status"] == "ok", "test delete post1");
    });

    hf_com.delete_data_chunk("post2","user1",null);
    hf_com.get_data_chunk("post2", "", function(json_message){
        test_utils.assert(json_message["status"] == "failed", "test delete post2");
    });
}

test_hf_com.main = function()
{
    test_utils.run(test_hf_com.test_create_data_chunk, 'test_hf_com.test_create_data_chunk');
    test_utils.run(test_hf_com.test_data_chunk_modifications, 'test_hf_com.test_data_chunk_operations');
    test_utils.run(test_hf_com.test_data_chunk_delections, 'test_hf_com.test_data_chunk_delections');
}
