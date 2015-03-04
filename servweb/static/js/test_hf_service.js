
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

test_hf_service.user_example_post = function()
{
    return "I'm new in HiddenFaces. What should I do first?";
}

test_utils.threads_example = function()
{
    var user_profile = test_hf_service.john_smith_profile();
    hf_service.create_user(user_profile);

    var owner_hash = hf.generate_hash("cWDb8suW3i");

    //user connexion
    hf_service.login_user(user_profile, null);
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    var thread1_info = null;
    var thread2_info = null;

    //threads list creation
    hf_service.create_thread(owner_hash,true,false,function(thread_info){
            test_utils.assert(thread_info['status'] == "ok");
            thread1_info = thread_info;
        });
    hf_service.create_thread(owner_hash,true,true,function(thread_info){
            test_utils.assert(thread_info['status'] == "ok");
            thread2_info = thread_info;
        });

    test_utils.assert(thread1_info != null);
    test_utils.assert(thread2_info != null);
    return [thread1_info,thread2_info];
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

test_hf_service.send_chunks_infos_to_contacts = function()
{
    //create all users
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);

    var chunks_infos = [
        {
            'name': hf.hash('chunk0'),
            'type': '/thread',
            'symetric_key': 'AES\nhello'
        },
        {
            'name': hf.hash('chunk1'),
            'type': '/thread',
            'symetric_key': 'AES\nworld'
        }
    ];

    hf_service.login_user(user_profile1);
    hf_service.add_contact(user_hash0);
    hf_service.disconnect();

    hf_service.login_user(user_profile0);
    hf_service.add_contact(user_hash1);
    hf_service.send_chunks_infos_to_contacts([user_hash1], chunks_infos, function(success){
        test_utils.assert(success == true, 'notification pushed with success')
    });
    hf_service.disconnect();

    hf_service.login_user(user_profile1);
    hf_service.pull_fresh_notifications();

    test_utils.assert(
        hf_service.user_private_chunk['contacts'][user_hash0]['threads'].indexOf(chunks_infos[0]['name']) >= 0,
        'chunk0 should be listed in user 0\'s threads'
    );

    test_utils.assert(
        hf_service.user_private_chunk['contacts'][user_hash0]['threads'].indexOf(chunks_infos[1]['name']) >= 0,
        'chunk1 should be listed in user 0\'s threads'
    );

    test_utils.assert(
        hf_service.get_encryption_key(hf_service.user_private_chunk, chunks_infos[0]['name']) == chunks_infos[0]['symetric_key'],
        'chunk0 should be listed in user 0\'s threads'
    );

    test_utils.assert(
        hf_service.get_encryption_key(hf_service.user_private_chunk, chunks_infos[1]['name']) == chunks_infos[1]['symetric_key'],
        'chunk1 should be listed in user 0\'s threads'
    );

    test_utils.assert_success(5);
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

    hf_service.store_key(fake_chunk, chunk_name[3], '');

    test_utils.assert(
        hf_service.get_encryption_key(fake_chunk, chunk_name[3]) == '',
        'chunk_name[3]\'s encryption key should be an empty string'
    );
    test_utils.assert(
        hf_service.get_decryption_key(fake_chunk, chunk_name[3]) == '',
        'chunk_name[3]\'s decryption key should be an empty string'
    );
}


// ------------------------------------------------- REGISTRY TESTS

test_hf_service.is_valide_chunk = function()
{
    //__meta is absent
    var private_chunk = {};
    var valide = hf_service.is_valide_chunk(private_chunk);
    test_utils.assert(valide == false, "private chunk has no __meta tag");
    // type is absent in __meta
    private_chunk['__meta'] = {};
    valide = hf_service.is_valide_chunk(private_chunk);
    test_utils.assert(valide == false, "private_chunk['__meta'] has no 'type' tag");

    // meta type is not in registry
    private_chunk['__meta']['type'] = '/user/some_chunk';
    valide = hf_service.is_valide_chunk(private_chunk);
    test_utils.assert(valide == false, "private_chunk['__meta'] is wrong");

    test_utils.assert_success(3);
}

test_hf_service.is_valide_profile = function()
{
    var chunk_profile = {};

    // emtpy chunk_profile
    var valide = hf_service.is_valide_profile(chunk_profile);
    test_utils.assert(valide == false, 'chunk_profile is empty');

    // chunk_profile has no last_name key
    chunk_profile['first_name'] = '';
    valide = hf_service.is_valide_profile(chunk_profile);
    test_utils.assert(valide == false, 'chunk_profile has no last name');

    // chunk_profile has empty first_name and last_name
    chunk_profile['last_name'] = '';
    valide = hf_service.is_valide_profile(chunk_profile);
    test_utils.assert(valide == false, 'chunk_profile has empty first_name && last_name');
    valide = hf_service.is_valide_private_profile(chunk_profile);
    test_utils.assert(valide == false, 'private chunk_profile has false commun party ');

    // chunk_profile is well formatted
    chunk_profile['first_name'] = 'john';
    chunk_profile['last_name'] = 'smith';
    valide = hf_service.is_valide_profile(chunk_profile);
    test_utils.assert(valide == true, 'chunk_profile is well formatted');
    valide = hf_service.is_valide_private_profile(chunk_profile);
    test_utils.assert(valide == false, 'private chunk_profile has no key');

    // ------------- Test for private chunk -------------------
    // empty email
    chunk_profile['email'] = '';
    valide = hf_service.is_valide_private_profile(chunk_profile);
    test_utils.assert(valide == false, 'private chunk_profile has empty key');

    // well formatted
    chunk_profile['email'] = 'john@smith.com';
    valide = hf_service.is_valide_private_profile(chunk_profile);
    test_utils.assert(valide == true, 'private chunk_profile is well formatted');

    test_utils.assert_success(8);
}

test_hf_service.is_valide_meta = function()
{
    var chunk_meta = {};

    // empty chunk_meta
    var valide = hf_service.is_valide_meta(chunk_meta);
    test_utils.assert(valide == false, 'chunk_meta is empty');

    // chunk_meta has no chunk_name
    var random_user_hash = hf.generate_hash('randomsalt');
    chunk_meta['user_hash'] = 'abcd';
    valide = hf_service.is_valide_meta(chunk_meta);
    test_utils.assert(valide == false, 'chunk_meta has no chunk_name tag');

    // chunk_meta has user_hash and chunk_name but wrong format (not hash)
    var random_chunk_name = hf.generate_hash('randomsalt');
    chunk_meta['chunk_name'] = 'abcd';
    valide = hf_service.is_valide_meta(chunk_meta);
    test_utils.assert(valide == false, 'chunk_meta has 2 wrong hashes');

    // chunk_meta's chunk_name is not hash
    chunk_meta['user_hash'] = random_user_hash;
    valide = hf_service.is_valide_meta(chunk_meta);
    test_utils.assert(valide == false, 'chunk_meta has chunk_name wrong hash');
    valide = hf_service.is_valide_private_meta(chunk_meta);
    test_utils.assert(valide == false, 'private_chunk_meta is wrong because commun chunk_meta is wrong');

    // chunk_meta is well formatted
    chunk_meta['chunk_name'] = random_chunk_name;
    valide = hf_service.is_valide_meta(chunk_meta);
    test_utils.assert(valide == true, 'chunk_meta is well formatted');

    // private chunk meta test, there is no key
    valide = hf_service.is_valide_private_meta(chunk_meta);
    test_utils.assert(valide == false, 'private_chunk_meta has no key tag');

    // empty key
    chunk_meta['key'] = '';
    valide = hf_service.is_valide_private_meta(chunk_meta);
    test_utils.assert(valide == false, 'private_chunk_meta has an empty key');

    // private chunk_meta is well formatted
    chunk_meta['key'] = 'random_key';
    valide = hf_service.is_valide_private_meta(chunk_meta);
    test_utils.assert(valide == true, 'private_chunk_meta is well formatted');

    test_utils.assert_success(9);
}

test_hf_service.is_valide_system = function()
{
    var chunk_system = {};

    // empty chunk_system
    var valide = hf_service.is_valide_system(chunk_system);
    test_utils.assert(valide == false, 'chunk_system is empty');

    // empty protected_chunk
    chunk_system['protected_chunk'] = {};
    valide = hf_service.is_valide_system(chunk_system);
    test_utils.assert(valide == false, 'chunk_system["protected_chunk"] is empty');

    // there is no public_key key
    chunk_system['protected_chunk']['name'] = '';
    valide = hf_service.is_valide_system(chunk_system);
    test_utils.assert(valide == false, 'chunk_system["protected_chunk"] has no public_key');

    // empty values
    chunk_system['protected_chunk']['public_key'] = '';
    valide = hf_service.is_valide_system(chunk_system);
    test_utils.assert(valide == false, 'chunk_system["protected_chunk"] has name and public_key are empty');

    //public_key is empty
    chunk_system['protected_chunk']['name'] = 'name';
    valide = hf_service.is_valide_system(chunk_system);
    test_utils.assert(valide == false, 'public_key is empty');

    // name is'n hash
    chunk_system['protected_chunk']['public_key'] = 'RSA_public_key';
    valide = hf_service.is_valide_system(chunk_system);
    test_utils.assert(valide == false, 'name is not hash');

    // commun party is well formatted
    chunk_system['protected_chunk']['name'] = hf.generate_hash('randomhash');
    valide = hf_service.is_valide_system(chunk_system);
    test_utils.assert(valide == true, 'chunk_system is well formatted');

    // private chunk_system has no chunks_owner
    valide = hf_service.is_valide_private_system(chunk_system);
    test_utils.assert(valide == false, 'chunk_system has no chunks_owner');

    // private chunk has wrong chunks_owner type
    chunk_system['chunks_owner'] = 'random_hash';
    chunk_system['protected_chunk']['private_key'] = 'RSA_private_key';
    valide = hf_service.is_valide_private_system(chunk_system);
    test_utils.assert(valide == false, 'chunks_owner wrong hash type');

    // private chunk well formatted
    chunk_system['chunks_owner'] = hf.generate_hash("randomsalt");
    valide = hf_service.is_valide_private_system(chunk_system);
    test_utils.assert(valide == true, 'private_chunk is well formatted');

    test_utils.assert_success(10);
}

test_hf_service.is_valide_private_chunk = function()
{
    var user_profile0 = test_hf_service.john_smith_profile();
    var user_hash0 = hf_service.create_user(user_profile0);

    hf_service.login_user(user_profile0, null);


    var private_chunk = {
            '__meta': {
                'type':         '/user/private_chunk',
                'user_hash':    'user_hash',
                'chunk_name':   'private_chunk_name',
                'key':          'private_chunk_key'
            },
            'profile': {
                'first_name':   'john',
                'last_name':    'smith',
                'email':        '',
            },
            'system': {
                'protected_chunk': {
                    'name':         'protected_chunk_name',
                    'private_key':  'protected_chunk_private_key',
                    'public_key':   'protected_chunk_public_key'
                },
                'chunks_owner':  'chunks_owner'
            }
        };


    test_utils.assert(hf_service.is_valide_private_chunk(private_chunk) == false, 'private chunk misses a lots');

    var user_private_chunk = hf_service.user_private_chunk;
    private_chunk['__meta']['user_hash'] = user_private_chunk['__meta']['user_hash'];
    private_chunk['__meta']['chunk_name'] = user_private_chunk['__meta']['chunk_name'];
    private_chunk['notifications'] = user_private_chunk['notifications'];
    private_chunk['contacts'] = user_private_chunk['contacts'];
    private_chunk['keykeeper'] = user_private_chunk['keykeeper'];
    private_chunk['circles'] = user_private_chunk['circles'];

    test_utils.assert(hf_service.is_valide_private_chunk(private_chunk) == false, 'private profile is wrong');

    private_chunk['profile']['email'] = user_private_chunk['profile']['email'];
    test_utils.assert(hf_service.is_valide_private_chunk(private_chunk) == false, 'private system is wrong');

    private_chunk['system']['protected_chunk']['name'] = user_private_chunk['system']['protected_chunk']['name'];
    test_utils.assert(hf_service.is_valide_private_chunk(private_chunk) == false, 'private chunks chunks_owner is wrong');

    private_chunk['system']['chunks_owner'] = user_private_chunk['system']['chunks_owner'];
    test_utils.assert(hf_service.is_valide_private_chunk(private_chunk) == true, 'private chunk is well formatted');


    test_utils.assert_success(5);
}

test_hf_service.is_valide_public_chunk = function()
{
    var user_profile0 = test_hf_service.john_smith_profile();
    var user_hash0 = hf_service.create_user(user_profile0);

    hf_service.login_user(user_profile0, null);

    var user_private_chunk = hf_service.user_private_chunk;

    var public_chunk = {
        '__meta': {
            'type':         '/user/public_chunk',
            'user_hash':    user_private_chunk['__meta']['user_hash'],
            'chunk_name':   user_private_chunk['__meta']['user_hash']
        }

    };

    var is_valide = hf_service.is_validate_public_chunk(public_chunk);
    test_utils.assert(is_valide == false, 'public chunk has no profile && system');

    public_chunk['profile'] =  {
            'first_name':   user_private_chunk['profile']['first_name'],
            'last_name':    user_private_chunk['profile']['last_name'],
            'email':        ''
        };

    is_valide = hf_service.is_validate_public_chunk(public_chunk);
    test_utils.assert(is_valide == false, 'public chunk has no system');

    public_chunk['system'] =  {
            'protected_chunk': {
                'name':         user_private_chunk['system']['protected_chunk']['name'],
                'public_key':   user_private_chunk['system']['protected_chunk']['public_key']
            }
        };

    is_valide = hf_service.is_validate_public_chunk(public_chunk);
    test_utils.assert(is_valide == true, 'public chunk is well formatted');

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

    // NOTIFICATIONS TESTS
    test_utils.run(test_hf_service.push_notification, 'test_hf_service.push_notification');
    test_utils.run(test_hf_service.notification_automation_sanity, 'test_hf_service.notification_automation_sanity');
    test_utils.run(test_hf_service.list_notifications, 'test_hf_service.list_notifications');
    test_utils.run(test_hf_service.delete_notification, 'test_hf_service.delete_notification');
    test_utils.run(test_hf_service.send_message, "test_hf_service.send_message");
    test_utils.run(test_hf_service.send_chunks_infos_to_contacts, 'test_hf_service.send_chunks_infos_to_contacts');

    // KEYKEEPER TESTS
    test_utils.run(test_hf_service.keys_repository, 'test_hf_service.keys_repository');

    // CONTACTS TESTS
    test_utils.run(test_hf_service.add_contact, "test_hf_service.add_contact");
    test_utils.run(test_hf_service.is_contact, "test_hf_service.is_contact");
    test_utils.run(test_hf_service.list_contacts,"test_hf_service.list_contacts");

    // THREADS & POSTS & COMMENTS TESTS
    test_utils.run(test_hf_service.post_message, 'test_hf_service.post_message');
    test_utils.run(test_hf_service.create_thread, 'test_hf_service.create_thread');
    test_utils.run(test_hf_service.append_post_to_threads, 'test_hf_service.append_post_to_threads');
    test_utils.run(test_hf_service.list_posts_thread, 'test_hf_service.list_posts_thread');
    test_utils.run(test_hf_service.merge_posts_lists, 'test_hf_service.merge_posts_lists');
    test_utils.run(test_hf_service.comment_post, 'test_hf_service.comment_post');

    // CIRCLES
    test_utils.run(test_hf_service.create_circle, 'test_hf_service.create_circle');
    test_utils.run(test_hf_service.add_contact_to_circle, 'test_hf_service.add_contact_to_circle');
    test_utils.run(test_hf_service.is_contact_into_circle, 'test_hf_service.is_contact_into_circle');
    test_utils.run(test_hf_service.list_circles, 'test_hf_service.list_circles');

    // REGISTRY TESTES
    test_utils.run(test_hf_service.is_valide_chunk,"test_hf_service.is_valide_chunk");
    test_utils.run(test_hf_service.is_valide_profile,'test_hf_service.is_valide_profile');
    test_utils.run(test_hf_service.is_valide_meta,'test_hf_service.is_valide_meta');
    test_utils.run(test_hf_service.is_valide_system,'test_hf_service.is_valide_system');
    test_utils.run(test_hf_service.is_valide_private_chunk,'test_hf_service.is_valide_private_chunk');
    test_utils.run(test_hf_service.is_valide_public_chunk,'test_hf_service.is_valide_public_chunk');

    //CHUNKS VERIFICATION
    test_utils.run(test_hf_service.verify_certification, 'test_hf_service.verify_certification');
    test_utils.run(test_hf_service.verify_post_certification,'test_hf_service.verify_post_certification');
    test_utils.run(test_hf_service.verify_append_posts_certification,'test_hf_service.verify_append_posts_certification');
    test_utils.run(test_hf_service.verify_comment_certification,'test_hf_service.verify_comment_certification');
}
