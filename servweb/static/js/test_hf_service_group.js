test_hf_service.group_examples = function(id)
{
    var group_names = [
        'Aliens',
        'Alligators',
        'Angels',
        'Dragons',
        'Dynamite',
        'Eagles',
        'Eclipse',
        'Magic',
        'Mercenaries',
        'Monsoon',
        'Stallions',
        'Stingers',
    ];
    assert(group_names.length == 12);

    id = id || 0;
    id %= group_names.length;

    return {
        'name':   group_names[id],
        'description':    'Discusion group about ' + group_names[id]
    }
}
//-------------------------------------------------------------------------------- TESTS GROUPS
test_hf_service.create_group = function()
{
    //user connexion
    var user_profile = test_hf_service.john_smith_profile();
    hf_service.create_user(user_profile);
    hf_service.login_user(user_profile, null);
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    //group creation
    var group_info = test_hf_service.group_examples();
    hf_service.create_group(
        group_info['name'],
        group_info['description'],
        false, false,
        function(group_hash){
            test_utils.assert(hf.is_hash(group_hash),'Cannot create group');
            test_utils.assert(hf_service.is_group_admin(group_hash));
        }
    );

    test_utils.assert_success(3);
}
