
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

test_hf_service.is_connected = function()
{
    test_utils.assert(!hf_service.is_connected(), 'no-one should be signed up at the begining');
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
            user_public_chunk['meta']['user_hash'] == user_hash0,
            'hf_service.get_user_public_chunk() has failed with cache'
        );
    });

    hf_service.reset_cache();
    hf_service.get_user_public_chunk(user_hash0, function(user_public_chunk){
        test_utils.assert(
            user_public_chunk['meta']['user_hash'] == user_hash0,
            'hf_service.get_user_public_chunk() has failed without cache'
        );
    });

    test_utils.assert_success(2);
}

test_hf_service.main = function()
{
    test_utils.run(test_hf_service.is_connected, 'test_hf_service.is_connected');
    test_utils.run(test_hf_service.create_account, 'test_hf_service.create_account');
    test_utils.run(test_hf_service.get_user_public_chunk, 'test_hf_service.get_user_public_chunk');
}
