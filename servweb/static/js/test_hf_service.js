
var test_hf_service = {};


// --------------------------------------------------------- DATABASE GENERATION

test_hf_service.john_smith_profile = function(id)
{
    id = id || 0;

    var first_names = [
        'john',
        'michael',
        'matthew',
        'joshua',
        'andrew',
        'daniel',
        'james',
        'david',
        'ashley',
        'jessica',
        'brittany',
        'amanda',
        'samantha',
        'sarah',
        'stephanie',
        'jennifer'
    ];

    var last_names = [
        'smith',
        'johnson',
        'williams',
        'jones',
        'brown',
        'davis',
        'miller',
        'wilson',
        'moore',
        'taylor',
        'anderson',
        'thomas',
        'jackson',
        'white',
        'harris',
        'martin'
    ];

    assert(first_names.length == 16);
    assert(last_names.length == 16);

    var first_name_id = id % first_names.length;
    var last_name_id = (id / first_names.length) ^ first_name_id;
    var sex = 'm';

    if (first_name_id >= 8)
    {
        sex = 'f';
    }

    return {
        'first_name':   first_names[first_name_id],
        'last_name':    last_names[last_name_id],
        'sex':          sex,
        'email':        first_names[first_name_id] + '@' + last_names[last_name_id] + '.com',
        'password':     first_names[first_name_id],
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


// ---------------------------------------------------------- USER ACCOUNT TESTS

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
    var user_wrong_login_profile = {
        'email': user_profile0['email'],
        'password': (user_profile0['email'] + ' wrong password')
    };

    test_utils.assert(!hf_service.is_connected(), 'no-one should be signed in after sign up');

    hf_service.login_user(user_profile0, function(user_connection_hash){
        test_utils.assert(user_connection_hash == user_hash0, 'unmatching user\'s hash');
        test_utils.assert(hf_service.is_connected(), 'should be connected after login in');
    });

    // for testing purposes, we should be connected after
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    hf_service.disconnect();

    test_utils.assert(!hf_service.is_connected(), 'should be disconneted');

    hf_service.login_user(user_wrong_login_profile, function(user_connection_hash){
        test_utils.assert(user_connection_hash == null, 'user_connection_hash should be null');
        test_utils.assert(!hf_service.is_connected(), 'should not be connected after failed log in');
    });

    test_utils.assert(!hf_service.is_connected(), 'should be disconneted');

    test_utils.assert_success(8);
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

test_hf_service.is_contact = function()
{
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);
    var user_profile2 = test_hf_service.john_smith_profile(2);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);
    var user_hash2 = hf_service.create_user(user_profile2);

    hf_service.login_user(user_profile0);

    test_utils.assert(hf_service.is_contact(user_hash1) == false, 'user_hash1 should not be a contact');
    test_utils.assert(hf_service.is_contact(user_hash2) == false, 'user_hash2 should not be a contact');

    hf_service.add_contact(user_hash1);

    test_utils.assert(hf_service.is_contact(user_hash1) == true, 'user_hash1 should be a contact');
    test_utils.assert(hf_service.is_contact(user_hash2) == false, 'user_hash2 should be a contact');
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


// --------------------------------------------------------- NOTIFICATIONS TESTS

hf_service.define_notification('/notification/testing/manual', {
    automation: null,
    resolve: hf_service.resolve_notification_author
});

test_hf_service.push_notification = function()
{
    var user_profile0 = test_hf_service.john_smith_profile();
    var user_hash0 = hf_service.create_user(user_profile0);

    hf_service.login_user(user_profile0);

    var notification = {
        '__meta': {
            'type': '/notification/testing/manual',
            'author_user_hash': hf_service.user_hash()
        },
        'content': 'Hi John! How are you?'
    };

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

test_hf_service.notification_automation_util = function(send_notification_callback)
{
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);

    hf_service.login_user(user_profile0);

    var assert_count = send_notification_callback(user_hash1);

    hf_service.disconnect();
    hf_service.login_user(user_profile1);

    hf_com.get_data_chunk(
        hf_service.user_public_chunk()['system']['protected_chunk']['name'],
        '',
        function(json_message){
            test_utils.assert(
                json_message['chunk_content'].length > 0,
                'looks like the notification has not been sent to user_profile1'
            );
        }
    );

    test_utils.assert_success(1);

    hf_service.pull_fresh_notifications();

    test_utils.assert_success(assert_count);

    hf_com.get_data_chunk(
        hf_service.user_public_chunk()['system']['protected_chunk']['name'],
        '',
        function(json_message){
            test_utils.assert(
                json_message['chunk_content'].length == 0,
                'hf_service.pull_fresh_notifications() failed should clean the protected chunk'
            );
        }
    );

    test_utils.assert(
        hf_service.user_private_chunk['notifications'].length == 0,
        'hf_service.pull_fresh_notifications() should not modify the user\'s private chunk'
    );

    test_utils.assert_success(2);
}

test_hf_service.notification_automation_sanity = function()
{
    test_hf_service.notification_automation_util(function(user_hash){
        var original_notification = {
            '__meta': {
                'type': '/notification/testing/automated',
                'author_user_hash': hf_service.user_hash()
            }
        };

        hf_service.define_notification('/notification/testing/automated', {
            automation: function(notification_json) {
                test_utils.assert(
                    notification_json['__meta']['type'] == '/notification/testing/automated',
                    'corrupted notification type'
                );
                test_utils.assert(
                    notification_json['__meta']['author_user_hash'] == original_notification['__meta']['author_user_hash'],
                    'corrupted notification author'
                );
            },
            resolve: null
        });

        hf_service.push_notification(user_hash, original_notification, function(success){
            test_utils.assert(success == true, 'notification push with success')
        });

        test_utils.assert_success(1);

        return 2;
    });
}

test_hf_service.list_notifications = function()
{
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_hash0 = hf_service.create_user(user_profile0);

    var original_notification = {
        '__meta': {
            'type': '/notification/testing/manual',
            'author_user_hash': user_hash0
        }
    };

    hf_service.login_user(user_profile0);

    hf_service.list_notifications(function(notifications_list){
        test_utils.assert(notifications_list.length == 0, 'should not have any notifications');
    });

    hf_service.push_notification(user_hash0, original_notification, function(success){
        test_utils.assert(success == true, 'should push a testing notification');
    });

    hf_service.push_notification(user_hash0, original_notification, function(success){
        test_utils.assert(success == true, 'should push another testing notification');
    });

    hf_service.list_notifications(function(notifications_list){
        test_utils.assert(notifications_list.length == 2, 'should have two notifications');
        test_utils.assert('author' in notifications_list[0], 'should have author resolved');
        test_utils.assert(
            hf.is_hash(notifications_list[0]['__meta']['hash']),
            'notification[\'__meta\'][\'hash\'] should be a hash'
        );
    });

    test_utils.assert_success(6);
}

test_hf_service.delete_notification = function()
{
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_hash0 = hf_service.create_user(user_profile0);

    var original_notification = {
        '__meta': {
            'type': '/notification/testing/manual',
            'author_user_hash': user_hash0
        }
    };

    hf_service.login_user(user_profile0);

    hf_service.delete_notification(hf.generate_hash(''), function(success){
        test_utils.assert(success == false, 'deleting a non existing notification should fail');
    });

    hf_service.push_notification(user_hash0, original_notification, function(success){
        test_utils.assert(success == true, 'should push a testing notification');
    });

    hf_service.push_notification(user_hash0, original_notification, function(success){
        test_utils.assert(success == true, 'should push another testing notification');
    });

    hf_service.list_notifications(function(notifications_list){
        test_utils.assert(notifications_list.length == 2, 'should have two notifications');

        hf_service.delete_notification(notifications_list[0]['__meta']['hash'], function(success){
            test_utils.assert(success == true, 'deleting existing notification should success');
        });
    });

    hf_service.list_notifications(function(notifications_list){
        test_utils.assert(notifications_list.length == 1, 'should have one notification');
    });

    test_utils.assert_success(6);
}

test_hf_service.send_message = function()
{
    var message = 'hello, could you add me as friend, DDD';
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);

    hf_service.login_user(user_profile0);

    hf_service.send_message(user_hash1, message, function(success) {
        test_utils.assert(success == true, "sent message must have successed");
    });

    hf_service.send_message(user_hash0, message, function(success) {
        test_utils.assert(success == false, "sent message must have failed");
    });

    test_utils.assert_success(2);
}


// ------------------------------------------------------------- KEYKEEPER TESTS

test_hf_service.keys_repository = function()
{
    var fake_chunk = {};
    var chunk_name = [
        hf.hash('chunk 0'),
        hf.hash('chunk 1'),
        hf.hash('chunk 2'),
        hf.hash('chunk 3')
    ];

    hf_service.init_key_repository(fake_chunk);

    test_utils.assert(
        hf_service.get_encryption_key(fake_chunk, chunk_name[0]) == '',
        'unknown chunk\'s encryption key should be empty'
    );
    test_utils.assert(
        hf_service.get_decryption_key(fake_chunk, chunk_name[0]) == '',
        'unknown chunk\'s decryption key should be empty'
    );

    hf_service.store_key(fake_chunk, chunk_name[0], test_hf_com.fake_AES_key(0));
    hf_service.store_key(fake_chunk, chunk_name[1], test_hf_com.fake_RSA_public_key(1));
    hf_service.store_key(fake_chunk, chunk_name[2], test_hf_com.fake_RSA_private_key(2));
    hf_service.store_key(fake_chunk, chunk_name[3], test_hf_com.fake_RSA_public_key(3));
    hf_service.store_key(fake_chunk, chunk_name[3], test_hf_com.fake_RSA_private_key(3));

    test_utils.assert(
        hf_service.get_encryption_key(fake_chunk, chunk_name[0]) == test_hf_com.fake_AES_key(0),
        'invalid chunk_name[0]\'s encryption key'
    );
    test_utils.assert(
        hf_service.get_decryption_key(fake_chunk, chunk_name[0]) == test_hf_com.fake_AES_key(0),
        'invalid chunk_name[0]\'s decryption key'
    );

    test_utils.assert(
        hf_service.get_encryption_key(fake_chunk, chunk_name[1]) == test_hf_com.fake_RSA_public_key(1),
        'invalid chunk_name[1]\'s encryption key'
    );
    test_utils.assert(
        hf_service.get_decryption_key(fake_chunk, chunk_name[1]) == '',
        'invalid chunk_name[1]\'s decryption key'
    );

    test_utils.assert(
        hf_service.get_encryption_key(fake_chunk, chunk_name[2]) == '',
        'invalid chunk_name[2]\'s encryption key'
    );
    test_utils.assert(
        hf_service.get_decryption_key(fake_chunk, chunk_name[2]) == test_hf_com.fake_RSA_private_key(2),
        'invalid chunk_name[2]\'s decryption key'
    );

    test_utils.assert(
        hf_service.get_encryption_key(fake_chunk, chunk_name[3]) == test_hf_com.fake_RSA_public_key(3),
        'invalid chunk_name[3]\'s encryption key'
    );
    test_utils.assert(
        hf_service.get_decryption_key(fake_chunk, chunk_name[3]) == test_hf_com.fake_RSA_private_key(3),
        'invalid chunk_name[3]\'s decryption key'
    );
}

test_hf_service.send_chunks_keys = function()
{
    var chunks_names = [
        hf.hash('chunk0'),
        hf.hash('chunk1')
    ];

    var chunks_keys = {};
    chunks_keys[chunks_names[0]] = 'AES\nhello';
    chunks_keys[chunks_names[1]] = 'AES\nworld';

    test_hf_service.notification_automation_util(function(user_hash){
        hf_service.send_chunks_keys([user_hash], chunks_keys, function(success){
            test_utils.assert(success == true, 'notification push with success')
        });

        test_utils.assert_success(1);

        return 0;
    });

    test_utils.assert(
        hf_service.get_encryption_key(hf_service.user_private_chunk, chunks_names[0]) == chunks_keys[chunks_names[0]],
        'invalid chunk_name[0]\'s encryption key'
    );

    test_utils.assert(
        hf_service.get_encryption_key(hf_service.user_private_chunk, chunks_names[1]) == chunks_keys[chunks_names[1]],
        'invalid chunk_name[1]\'s encryption key'
    );
}


// ------------------------------------------------------- THREADS & POSTS TESTS

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


// ------------------------------------------------- SERVICE's TESTS ENTRY POINT

test_hf_service.main = function()
{
    // USER ACCOUNT TESTS
    test_utils.run(test_hf_service.create_account, 'test_hf_service.create_account');
    test_utils.run(test_hf_service.get_user_public_chunk, 'test_hf_service.get_user_public_chunk');
    test_utils.run(test_hf_service.login_user, 'test_hf_service.login_user');
    test_utils.run(test_hf_service.save_user_chunks, 'test_hf_service.save_user_chunks');
    test_utils.run(test_hf_service.add_contact, "test_hf_service.add_contact");
    test_utils.run(test_hf_service.is_contact, "test_hf_service.is_contact");
    test_utils.run(test_hf_service.list_contacts,"test_hf_service.list_contacts");

    // NOTIFICATIONS TESTS
    test_utils.run(test_hf_service.push_notification, 'test_hf_service.push_notification');
    test_utils.run(test_hf_service.notification_automation_sanity, 'test_hf_service.notification_automation_sanity');
    test_utils.run(test_hf_service.list_notifications, 'test_hf_service.list_notifications');
    test_utils.run(test_hf_service.delete_notification, 'test_hf_service.delete_notification');
    test_utils.run(test_hf_service.send_message, "test_hf_service.send_message");

    // KEYKEEPER TESTS
    test_utils.run(test_hf_service.keys_repository, 'test_hf_service.keys_repository');
    test_utils.run(test_hf_service.send_chunks_keys, 'test_hf_service.send_chunks_keys');

    // THREADS & POSTS TESTS
    test_utils.run(test_hf_service.post_message, 'test_hf_service.post_message');
    test_utils.run(test_hf_service.create_thread, 'test_hf_service.create_thread');
    test_utils.run(test_hf_service.append_post_to_threads, 'test_hf_service.append_post_to_threads');
}
