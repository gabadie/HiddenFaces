
var test_hf_service = {};

test_hf_service.john_smith_profile = function(id)
{
    id = id || 0;

    return {
        'first_name':   'john ' + id,
        'last_name':    'smith',
        'sex':          'm',
        'email':        'john' + id + '@smith.com',
        'password':     'CIA'  + id,
        'birth_date':   '1995-08-27'
    }
}

test_hf_service.user_example_post = function(user_hash)
{
    return {
        '__meta': {
            'type': '/post',
            'author_user_hash': user_hash
        },
        'content': "I'm new in HiddenFaces. What should I do first?"
    }
}

test_hf_service.create_account = function()
{
    var user_profile0 = test_hf_service.john_smith_profile();

    hf_service.create_user(user_profile0, function(user_hash){
        test_utils.assert(hf.is_hash(user_hash));
    });

    test_utils.assert(!hf_service.is_connected(), 'no-one should be signed in after sign up');
    test_utils.assert_success(2);
}

test_hf_service.get_user_public_chunk = function()
{
    var user_profile0 = test_hf_service.john_smith_profile();
    var user_hash0 = hf_service.create_user(user_profile0);

    hf_service.get_user_public_chunk(user_hash0, function(user_public_chunk){
        test_utils.assert(
            user_public_chunk['__meta']['user_hash'] == user_hash0,
            'hf_service.get_user_public_chunk() has failed with cache'
        );
    });

    hf_service.reset_cache();
    hf_service.get_user_public_chunk(user_hash0, function(user_public_chunk){
        test_utils.assert(
            user_public_chunk['__meta']['user_hash'] == user_hash0,
            'hf_service.get_user_public_chunk() has failed without cache'
        );
    });

    hf_service.get_user_public_chunk('invalid user hash', function(user_public_chunk){
        test_utils.assert(
            user_public_chunk == false,
            'hf_service.get_user_public_chunk() with an invalid user hash should fail'
        );
    });

    test_utils.assert_success(3);
}

test_hf_service.login_user = function()
{
    var user_profile0 = test_hf_service.john_smith_profile();
    var user_hash0 = hf_service.create_user(user_profile0);

    test_utils.assert(!hf_service.is_connected(), 'no-one should be signed in after sign up');

    hf_service.login_user(user_profile0, function(user_connection_hash){
        test_utils.assert(user_connection_hash == user_hash0, 'unmatching user\'s hash');
        test_utils.assert(hf_service.is_connected(), 'should be connected after login in');
    });

    // for testing purposes, we should be connected after
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    hf_service.disconnect();

    test_utils.assert(!hf_service.is_connected(), 'should be disconneted');

    test_utils.assert_success(5);
}

test_hf_service.save_user_chunks = function()
{
    var new_last_name = 'kennedy';
    var user_profile0 = test_hf_service.john_smith_profile();
    var user_hash0 = hf_service.create_user(user_profile0);

    hf_service.login_user(user_profile0);
    hf_service.user_private_chunk['profile']['last_name'] = new_last_name;
    hf_service.user_public_chunk()['profile']['last_name'] = new_last_name;
    hf_service.disconnect();

    hf_service.login_user(user_profile0);
    test_utils.assert(
        hf_service.user_private_chunk['profile']['last_name'] == user_profile0['last_name'],
        'birth date should not be modified in the private chunk'
    );
    test_utils.assert(
        hf_service.user_public_chunk()['profile']['last_name'] == user_profile0['last_name'],
        'birth date should not be modified in the public chunk'
    );
    hf_service.user_private_chunk['profile']['last_name'] = new_last_name;
    hf_service.user_public_chunk()['profile']['last_name'] = new_last_name;
    hf_service.save_user_chunks();
    hf_service.disconnect();

    hf_service.login_user(user_profile0);
    test_utils.assert(
        hf_service.user_private_chunk['profile']['last_name'] == new_last_name,
        'birth date should be modified in the private chunk'
    );
    test_utils.assert(
        hf_service.user_public_chunk()['profile']['last_name'] == new_last_name,
        'birth date should be modified in the public chunk'
    );
    //hf_service.disconnect();
}

test_hf_service.push_notification = function()
{
    var user_profile0 = test_hf_service.john_smith_profile();
    var user_hash0 = hf_service.create_user(user_profile0);

    var notification = {
        '__meta': {
            'type': '/notification/message',
            'author_user_hash': hf.hash('other_user')
        },
        'content': 'Hi John! How are you?'
    };

    hf_service.login_user(user_profile0);
    hf_service.get_user_public_chunk(user_hash0, function(user_public_chunk){
        hf_com.get_data_chunk(
            user_public_chunk['system']['protected_chunk']['name'],
            '',
            function(json_message){
                test_utils.assert(json_message['chunk_content'].length == 0);
            }
        );

        hf_service.push_notification(user_hash0, notification, function(success){
            test_utils.assert(success == true, 'notification push with success')
        });

        hf_com.get_data_chunk(
            user_public_chunk['system']['protected_chunk']['name'],
            '',
            function(json_message){
                test_utils.assert(json_message['chunk_content'].length == 1);
            }
        );
    });

    test_utils.assert_success(3);
}

test_hf_service.contact_request = function() {

    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);

    hf_service.login_user(user_profile0);

    hf_service.send_contact_request(user_hash1, "hello, could you add me as friend, DDD", function() {
        test_utils.success("sent contact request successful");
    });
}

test_hf_service.post_message = function()
{
    var user_profile = test_hf_service.john_smith_profile();
    var user_hash = hf_service.create_user(user_profile);

    //user connexion
    hf_service.login_user(user_profile, null);
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    //post creation
    var post_content = test_hf_service.user_example_post(user_hash);
    var post_info = hf_service.create_post(user_hash,post_content);

    test_utils.assert(typeof post_info['post_chunk_name'] == "string");
    test_utils.assert(typeof post_info['symetric_key'] == "string");

    test_utils.assert_success(3);
}

test_hf_service.create_thread = function()
{
    var user_profile = test_hf_service.john_smith_profile();
    var user_hash = hf_service.create_user(user_profile);

    //user connexion
    hf_service.login_user(user_profile, null);
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    var thread_info = hf_service.create_thread(user_hash,true);
    test_utils.assert(typeof thread_info['thread_chunk_name'] == "string");
    test_utils.assert(typeof thread_info['symetric_key'] == "string");

    test_utils.assert_success(3);
}

test_hf_service.append_post_to_threads = function()
{
    var user_profile = test_hf_service.john_smith_profile();
    var user_hash = hf_service.create_user(user_profile);

    //user connexion
    hf_service.login_user(user_profile, null);
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    //threads map creation
    var thread1_info = hf_service.create_thread(user_hash,true);
    var thread2_info = hf_service.create_thread(user_hash,true);
    var threads_map = [thread1_info,thread2_info];

    //post creation
    var post_content = test_hf_service.user_example_post(user_hash);
    var post_info = hf_service.create_post(user_hash,post_content);

    hf_service.append_post_to_threads(post_info, threads_map);

    hf_com.get_data_chunk(
            thread1_info['thread_chunk_name'],
            thread1_info['symetric_key'],
            function(json_message){
                test_utils.assert(json_message['chunk_content'].length == 1);
            }
        );
    hf_com.get_data_chunk(
            thread1_info['thread_chunk_name'],
            thread1_info['symetric_key'],
            function(json_message){
                test_utils.assert(json_message['chunk_content'].length == 1);
            }
        );

    test_utils.assert_success(3);
}

test_hf_service.add_contact = function() {
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);
    var user_profile2 = test_hf_service.john_smith_profile(2);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);
    var user_hash2 = hf_service.create_user(user_profile2);

    hf_service.login_user(user_profile0);

    hf_service.add_contact(user_hash1, function() {
        test_utils.assert(
            user_hash1 in hf_service.user_private_chunk['contacts'],
            'user_hash1 should be added into contacts'
        );
        test_utils.assert(
            !(user_hash2 in hf_service.user_private_chunk['contacts']),
            'user_hash2 should not be added into contacts'
        );
    });

    hf_service.add_contact(user_hash2, function() {
        test_utils.assert(
            user_hash1 in hf_service.user_private_chunk['contacts'],
            'user_hash1 should already be in contacts'
        );
        test_utils.assert(
            user_hash1 in hf_service.user_private_chunk['contacts'],
            'user_hash2 should be added into contacts'
        );
    });

    hf_service.add_contact("blabla", function(data) {
        test_utils.assert(data == false, "blabla is not a hash");
    });

    test_utils.assert_success(5);
}

test_hf_service.list_contacts = function()
{
    //create all users
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);

    var user_profile2 = test_hf_service.john_smith_profile(2);
    var user_hash2 = hf_service.create_user(user_profile2);

    //user0 is logged
    hf_service.login_user(user_profile0);

    hf_service.list_contacts(function(data) {
        test_utils.assert(Object.keys(data).length == 0, "there is no contact");
    });

    hf_service.add_contact(user_hash1);
    hf_service.add_contact(user_hash2);

    //construct expected result
    var expected_content = [];
    hf_service.get_user_public_chunk(user_hash1, function() {
        expected_content.push(hf_service.users_public_chunks[user_hash1])
    });

    hf_service.get_user_public_chunk(user_hash2, function() {
        expected_content.push(hf_service.users_public_chunks[user_hash2])
    });

    //actual result
    hf_service.list_contacts(function(data) {
        test_utils.assert(JSON.stringify(expected_content) === JSON.stringify(data), "get all contacts content is ok");
    });

    test_utils.assert_success(2);
}

test_hf_service.main = function()
{
    test_utils.run(test_hf_service.create_account, 'test_hf_service.create_account');
    test_utils.run(test_hf_service.get_user_public_chunk, 'test_hf_service.get_user_public_chunk');
    test_utils.run(test_hf_service.login_user, 'test_hf_service.login_user');
    test_utils.run(test_hf_service.save_user_chunks, 'test_hf_service.save_user_chunks');
    test_utils.run(test_hf_service.push_notification, 'test_hf_service.push_notification');
    test_utils.run(test_hf_service.post_message, 'test_hf_service.post_message');
    test_utils.run(test_hf_service.create_thread, 'test_hf_service.create_thread');
    test_utils.run(test_hf_service.append_post_to_threads, 'test_hf_service.append_post_to_threads');
    test_utils.run(test_hf_service.contact_request, "test_hf_service.contact_request");

    test_utils.run(test_hf_service.add_contact, "test_hf_service.add_contact");
    test_utils.run(test_hf_service.list_contacts,"test_hf_service.list_contacts");
}
