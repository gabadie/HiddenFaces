
var test_hf_com = {};

test_hf_com.setup_data_base = function()
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

test_hf_com.test_get_multiple_data_chunks = function()
{
    var t = new hf_com.Transaction();

    t.create_data_chunk('chunk1', 'user', '', ['hello'], false);
    t.create_data_chunk('chunk2', 'user', '', ['hello', 'world'], false);
    t.commit();

    hf_com.get_multiple_data_chunks(
        {
            'chunk1': '',
            'chunk2': '',
        },
        function(json_message){
            test_utils.assert(json_message['status'] == 'ok');
            test_utils.assert(json_message['chunk']['chunk1'].length == 1);
            test_utils.assert(json_message['chunk']['chunk2'].length == 2);
        }
    );

    test_utils.assert_success(3);
}

test_hf_com.test_data_chunk_modifications = function()
{
    test_hf_com.setup_data_base();

    //modify data chunk
    hf_com.write_data_chunk("private_user2","user2","",["name","birthday","interests"],function(json_message){
        test_utils.assert(json_message["status"] == "ok", "test overwrite private_user2");
    });
    hf_com.append_data_chunk("post1", "user2", "", "user2: amazing <3", function(json_message){
        test_utils.assert(json_message["status"] == "ok", "test append to post1");
    });
    hf_com.append_data_chunk("private_user1", "user2", "", "user2: amazing <3", function(json_message){
        test_utils.assert(json_message["status"] == "failed", "test append to private_user1");
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

    test_utils.assert_success(4 + 6);
}

test_hf_com.test_data_chunk_deletions = function()
{
    test_hf_com.setup_data_base();

    //delete data chunks
    hf_com.delete_data_chunk("post1","user2",null);
    hf_com.get_data_chunk("post1", "", function(json_message){
        test_utils.assert(json_message["status"] == "ok", "test delete post1");
    });

    hf_com.delete_data_chunk("post2","user1",null);
    hf_com.get_data_chunk("post2", "", function(json_message){
        test_utils.assert(json_message["status"] == "failed", "test delete post2");
    });

    test_utils.assert_success(4 + 2);
}

test_hf_com.transaction_get_data_chunk = function()
{
    var t = new hf_com.Transaction();
    t.create_data_chunk('chunk0', 'user', '', ['hello'], false);
    t.create_data_chunk('chunk1', 'user', '', ['foo', 'bar'], false);
    t.get_data_chunk('chunk0', '');
    t.get_data_chunk('chunk1', '');
    t.commit(function(json){
        test_utils.assert(json['chunk']['chunk0'].length == 1, "hf_com.Transaction.get_data_chunk('chunk0', '') failed");
        test_utils.assert(json['chunk']['chunk1'].length == 2, "hf_com.Transaction.get_data_chunk('chunk1', '') failed");
    });

    test_utils.assert_success(2);
}

test_hf_com.test_encrypt_AES = function() {
    var key = "AES \n mypassword";
    var data = "data to encrypt";
    var is_AES = hf_com.is_AES_key(key);
    test_utils.assert(is_AES === true, "test is_AES function for encrypting");

    var encrypted_data = hf_com.encrypt(key, data);

    var get_key = hf_com.get_key(key);
    test_utils.assert(get_key === " mypassword", "test get_key for encrypting");

    var decrypted_data = sjcl.decrypt(get_key, encrypted_data);
    test_utils.assert(data === decrypted_data, "test encrypt data for AES method");
}

test_hf_com.test_encrypt_empty_key = function() {
    var key = "";
    var data = "data to encrypt";
    var encrypted_data = hf_com.encrypt(key,data);
    test_utils.assert(data === encrypted_data, "test encrypt data AES with empty key");
}

test_hf_com.test_decrypt_AES = function() {
    var key = "AES \n mypassword";
    var data = "data to encrypt";

    var encrypted_data = sjcl.encrypt(hf_com.get_key(key), data);
    var decrypted_data = hf_com.decrypt(key, encrypted_data);
    test_utils.assert(data === decrypted_data, "test decrypt data with AES method");
}

test_hf_com.test_decrypt_RSA = function() {

    var data = "data to encrypt";

    hf_com.generate_RSA_key(function(private_key, public_key){
        var encrypted_data = hf_com.encrypt_RSA(hf_com.get_key(public_key), data);
        var decrypted_data = hf_com.decrypt_RSA(hf_com.get_key(private_key), encrypted_data);

        test_utils.assert(data === decrypted_data,"test decrypt data with RSA method");
        test_utils.assert(encrypted_data != data,"test encrypt data")
    });

    test_utils.assert_success(2);
}

test_hf_com.test_decrypt_empty_key = function() {
    var key = "";
    var data = "data to encrypt";
    var decrypted_data = hf_com.decrypt(key,data);
    test_utils.assert(data === decrypted_data, "test encrypt data AES with empty key");
}

test_hf_com.test_is_RSA_public_key = function() {
    var key = "RSA-1024-Public \n -----BEGIN PUBLIC KEY----- \nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDlOJu6TyygqxfWT7eLtGDwajtN\nFOb9I5XRb6khyfD1Yt3YiCgQWMNW649887VGJiGr/L5i2osbl8C9+WJTeucF+S76\nxFxdU6jE0NQ+Z+zEdhUTooNRaY5nZiu5PgDB0ED/ZKBUSLKL7eibMxZtMlUDHjm4gwQco1KRMDSmXSMkDwIDAQAB\n-----END PUBLIC KEY-----";
    test_utils.assert(hf_com.is_RSA__public_key(key) === true, "is RSA public key test");

    key = "RSA- 1024-Public \n -----BEGIN PUBLIC KEY----- \nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDlOJu6TyygqxfWT7eLtGDwajtN\nFOb9I5XRb6khyfD1Yt3YiCgQWMNW649887VGJiGr/L5i2osbl8C9+WJTeucF+S76\nxFxdU6jE0NQ+Z+zEdhUTooNRaY5nZiu5PgDB0ED/ZKBUSLKL7eibMxZtMlUDHjm4gwQco1KRMDSmXSMkDwIDAQAB\n-----END PUBLIC KEY-----";
    test_utils.assert(hf_com.is_RSA__public_key(key) === false, "is RSA public key test false");
}
test_hf_com.test_is_RSA_private_key = function() {
    var key = "RSA-1024-Private \n";
    test_utils.assert(hf_com.is_RSA__private_key(key) === true, "is RSA private key test");

    key = "RSA- 1024-Private \n";
    test_utils.assert(hf_com.is_RSA__private_key(key) === false, "is RSA private key test false");

}



test_hf_com.main = function()
{
    test_utils.run(test_hf_com.test_create_data_chunk, 'test_hf_com.test_create_data_chunk');
    test_utils.run(test_hf_com.test_get_multiple_data_chunks, 'test_hf_com.test_get_multiple_data_chunks');
    test_utils.run(test_hf_com.test_data_chunk_modifications, 'test_hf_com.test_data_chunk_operations');
    test_utils.run(test_hf_com.test_data_chunk_deletions, 'test_hf_com.test_data_chunk_deletions');
    test_utils.run(test_hf_com.transaction_get_data_chunk, 'test_hf_com.transaction_get_data_chunk');

    // Test for encrypt AES
    test_utils.run(test_hf_com.test_encrypt_AES, "test_hf_com.test_encrypt_AES");
    test_utils.run(test_hf_com.test_encrypt_empty_key, "test_hf_com.test_encrypt_empty_key");
    test_utils.run(test_hf_com.test_decrypt_AES, "test_hf_com.test_decrypt_AES");
    test_utils.run(test_hf_com.test_decrypt_empty_key, "test_hf_com.test_decrypt_empty_key");

    test_utils.run(test_hf_com.test_is_RSA_public_key, "test_hf_com.test_is_RSA__public_key");
    test_utils.run(test_hf_com.test_is_RSA_private_key, "test_hf_com.test_is_RSA__private_key");
    test_utils.run(test_hf_com.test_decrypt_RSA,"test_hf_com.test_decrypt_RSA");


}
