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

test_hf_service.add_user_to_group = function() {
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);
    var user_profile2 = test_hf_service.john_smith_profile(2);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);
    var user_hash2 = hf_service.create_user(user_profile2);

    hf_service.login_user(user_profile0);

    //group creation
    var group_info = test_hf_service.group_examples();
    hf_service.create_group(
        group_info['name'],
        group_info['description'],
        false, false,
        function(group_hash){
            test_utils.assert(hf.is_hash(group_hash),'Cannot create group');
            test_utils.assert(hf_service.is_group_admin(group_hash),'The current user has not be set as group admin');

            hf_service.add_user_to_group(user_hash1, group_hash, function(success){
                test_utils.assert(success == true,'Cannot add user_hash1 to group');
            });
            hf_service.add_user_to_group(user_hash2, group_hash, function(success){
                test_utils.assert(success == true,'Cannot add user_hash2 to group');
            });
            hf_service.add_user_to_group('fake', group_hash, function(success){
                test_utils.assert(success == false,'fake shouldn\'t have been added to group');
            });
            //verify group's users
            hf_service.get_group_private_chunk(group_hash, function(group_json){
                test_utils.assert(hf_service.already_user(user_hash1,group_json) == true,'user_hash1 is not a group user');
                test_utils.assert(hf_service.already_user(user_hash2,group_json) == true, 'user_hash2 is not a group user');
            });
        }
    );
    test_utils.assert_success(7);
}

test_hf_service.subscribe_to_group = function(){
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);
    var user_profile2 = test_hf_service.john_smith_profile(2);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);
    var user_hash2 = hf_service.create_user(user_profile2);

    hf_service.login_user(user_profile0);

    //group creation
    var group_info = test_hf_service.group_examples();
    var subscription_message = 'I would like to subscribe to this group';
    hf_service.create_group(
        group_info['name'],
        group_info['description'],
        false, false,
        function(group_hash){
            test_utils.assert(hf.is_hash(group_hash),'Cannot create group');
            hf_service.subscribe_to_group(group_hash, subscription_message, function(success){
                test_utils.assert(success == false, 'Admin could subscribe to the group');
                hf_service.list_groups(function(group_list){
                    test_utils.assert(group_list.length == 1,
                        'Admin hasn\'t subscribed to 1 group but '+group_list.length
                    );
                });
            });
            hf_service.disconnect();

            hf_service.login_user(user_profile1);
            hf_service.subscribe_to_group(group_hash, subscription_message, function(success){
                test_utils.assert(success == true, 'user_profile1 cannot subscribe to the group');
                hf_service.list_groups(function(group_list){
                    test_utils.assert(group_list.length == 1,
                        'user_profile1 hasn\'t subscribed to 1 group but '+group_list.length
                    );
                });
            });
            hf_service.disconnect();

            hf_service.login_user(user_profile2);
            hf_service.subscribe_to_group(group_hash, subscription_message, function(success){
                test_utils.assert(success == true, 'user_profile2 cannot subscribe to the group');
                hf_service.list_groups(function(group_list){
                    test_utils.assert(group_list.length == 1,
                        'user_profile2 hasn\'t subscribed to 1 group but '+group_list.length
                    );
                });
            });
            hf_service.disconnect();

            //admin connexion
            hf_service.login_user(user_profile0);
            hf_service.get_group_private_chunk(group_hash,function(group_private_chunk){
                test_utils.assert(group_private_chunk != null,
                    'Admin could not access to the group\'s private chunk'
                );
                hf_service.list_notifications(group_private_chunk, function(notifications_list){
                    test_utils.assert(notifications_list != null,
                        'There are no pending subscription requests'
                    );
                    test_utils.assert(notifications_list.length == 2,
                        'The number of notifications is not 2 but '+notifications_list.length
                    );
                });
            });
        }
    );
    test_utils.assert_success(10);
}
