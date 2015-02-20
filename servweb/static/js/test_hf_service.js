
var test_hf_service = {};

test_hf_service.create_account = function()
{
    var user_profile = {
        'name':         'john',
        'sirname':      'smith',
        'sex':          'm',
        'email':        'john@smith.com',
        'password':     'CIA',
        'birth_date':   '1995-08-27'
    }

    hf_service.create_user(user_profile);
}

test_hf_service.main = function()
{
    test_utils.run(test_hf_service.create_account, 'test_hf_service.create_account');
}
