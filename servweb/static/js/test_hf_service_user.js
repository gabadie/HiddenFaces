
test_hf_service.create_user = function()
{
    var user_profile0 = test_hf_service.john_smith_profile();

    var user_hash0 = hf_service.create_user(user_profile0, function(user_hash){
        test_utils.assert(hf.is_hash(user_hash));
    });

    test_utils.assert(!hf_service.is_connected(), 'no-one should be signed in after sign up');

    hf_service.global_list('/global/users_list', function(global_users_list){
        test_utils.assert(
            global_users_list.indexOf(user_hash0) >= 0,
            'user_hash0 should be in the global users list'
        );
    });

    test_utils.assert_success(3);
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

test_hf_service.get_users_public_chunks = function()
{
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);
    var users_hashes = [
        hf_service.create_user(user_profile0),
        hf_service.create_user(user_profile1)
    ];

    hf_service.reset_cache();
    hf_service.get_users_public_chunks(users_hashes, function(users_public_chunks){
        test_utils.assert(users_hashes[0] in users_public_chunks, 'users_hashes[0] should be in users_public_chunks');
        test_utils.assert(users_hashes[1] in users_public_chunks, 'users_hashes[1] should be in users_public_chunks');
    });

    hf_service.reset_cache();
    hf_service.get_users_public_chunks([users_hashes[0]], function(users_public_chunks){
        test_utils.assert(users_hashes[0] in users_public_chunks, 'users_hashes[0] should be lonely in users_public_chunks');
        test_utils.assert(!(users_hashes[1] in users_public_chunks), 'users_hashes[1] should not be in users_public_chunks');
    });

    hf_service.get_users_public_chunks(users_hashes, function(users_public_chunks){
        test_utils.assert(users_hashes[0] in users_public_chunks, 'users_hashes[0] should be in users_public_chunks (partially cached)');
        test_utils.assert(users_hashes[1] in users_public_chunks, 'users_hashes[1] should be in users_public_chunks (partially cached)');
    });

    hf_service.get_users_public_chunks(users_hashes, function(users_public_chunks){
        test_utils.assert(users_hashes[0] in users_public_chunks, 'users_hashes[0] should be in users_public_chunks (fully cached)');
        test_utils.assert(users_hashes[1] in users_public_chunks, 'users_hashes[1] should be in users_public_chunks (fully cached)');
    });

    test_utils.assert_success(8);
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

test_hf_service.change_user_login_profile = function()
{
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);

    var user_hash0 = hf_service.create_user(user_profile0);

    hf_service.login_user(user_profile0);
    hf_service.change_user_login_profile(user_profile1, test_utils.callbackSuccess);
    hf_service.disconnect();

    hf_service.login_user(user_profile0, function(user_hash){
        test_utils.assert(user_hash == null, 'login as profile 0 should fail');
    });

    hf_service.login_user(user_profile1, function(user_hash){
        test_utils.assert(user_hash == user_hash0, 'login as profile 1 should success');
    });
    hf_service.disconnect();

    test_utils.assert_success(3);
}
