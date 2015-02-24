
var test_hf_service = {};

test_hf_service.john_smith_profile = function(id)
{
    id = id || 0;

    return {
        'name':         'john ' + id,
        'sirname':      'smith',
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

    hf_service.create_user(user_profile0);

    test_utils.assert(!hf_service.is_connected(), 'no-one should be signed in after sign up');
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

    test_utils.assert_success(2);
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
    var new_birth_date = '1999-12-25';
    var user_profile0 = test_hf_service.john_smith_profile();
    var user_hash0 = hf_service.create_user(user_profile0);

    hf_service.login_user(user_profile0);
    hf_service.user_private_chunk['profile']['birth_date'] = new_birth_date;
    hf_service.user_public_chunk()['profile']['birth_date'] = new_birth_date;
    hf_service.disconnect();

    hf_service.login_user(user_profile0);
    test_utils.assert(
        hf_service.user_private_chunk['profile']['birth_date'] == user_profile0['birth_date'],
        'birth date should not be modified in the private chunk'
    );
    test_utils.assert(
        hf_service.user_public_chunk()['profile']['birth_date'] == '',
        'birth date should not be available in the public chunk'
    );
    hf_service.user_private_chunk['profile']['birth_date'] = new_birth_date;
    hf_service.user_public_chunk()['profile']['birth_date'] = new_birth_date;
    hf_service.save_user_chunks();
    hf_service.disconnect();

    hf_service.login_user(user_profile0);
    test_utils.assert(
        hf_service.user_private_chunk['profile']['birth_date'] == new_birth_date,
        'birth date should be modified in the private chunk'
    );
    test_utils.assert(
        hf_service.user_public_chunk()['profile']['birth_date'] == new_birth_date,
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

    hf_service.get_user_public_chunk(user_hash0, function(user_public_chunk){
        hf_com.get_data_chunk(
            user_public_chunk['system']['protected_chunk']['name'],
            '',
            function(json_message){
                test_utils.assert(json_message['chunk_content'].length == 0);
            }
        );

        hf_service.push_notification(user_hash0, notification, function(){
            test_utils.success('notification push with success')
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
}
