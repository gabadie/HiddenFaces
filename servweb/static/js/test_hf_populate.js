
test_hf_populate = {};

test_hf_populate.profile_count = 32;
test_hf_populate.message_count = 100;
test_hf_populate.contact_count = 200;


test_hf_populate.seed = 0;

test_hf_populate.rand = function()
{
    test_hf_populate.seed = (test_hf_populate.seed * 22695477 + 1) & 0xFFFFFFFF;
    return (test_hf_populate.seed >>> 0x10) & 0x7FFF;
}

test_hf_populate.create_users = function()
{
    test_hf_populate.user_profile = [];
    test_hf_populate.user_hash = [];

    test_hf_populate.user_profile[0] = test_hf_service.john_smith_profile(0);

    for (var i = 1; i < test_hf_populate.profile_count; i++)
    {
        var user_profile_id = test_hf_populate.rand() % 256;
        test_hf_populate.user_profile[i] = test_hf_service.john_smith_profile(user_profile_id);

        // avoid private chunk colision
        test_hf_populate.user_profile[i]['password'] = 'password' + i;
    }

    for (var i = 0; i < test_hf_populate.profile_count; i++)
    {
        test_hf_populate.user_hash[i] = hf_service.create_user(test_hf_populate.user_profile[i], function(user_hash){
            test_utils.assert(user_hash != null, 'failed to create profile ' + i);
        });

        hf_service.login_user(test_hf_populate.user_profile[i]);
        hf_service.create_circle('Family', function(success){
            test_utils.assert(success == true, 'failed to create profile ' + i + '\'s family circle');
        });
        hf_service.create_circle('Friends', function(success){
            test_utils.assert(success == true, 'failed to create profile ' + i + '\'s friends circle');
        });
        hf_service.disconnect();
    }

    test_utils.assert_success(test_hf_populate.profile_count * 3);
}

test_hf_populate.send_messages = function()
{
    for (var i = 0; i < test_hf_populate.message_count; i++)
    {
        var from = 0;
        var to = 0;

        while (from == to)
        {
            from = test_hf_populate.rand() % test_hf_populate.profile_count;
            to = test_hf_populate.rand() % test_hf_populate.profile_count;
        }

        var message = (
            'Hi ' + test_hf_populate.user_profile[to]['first_name'] +
            '! This is your dude ' + test_hf_populate.user_profile[from]['first_name'] + '.'
        );

        hf_service.login_user(test_hf_populate.user_profile[from]);
        hf_service.send_message(test_hf_populate.user_hash[to], message, function(success){
            test_utils.assert(success == true, 'failed to send message from ' + from + ' to ' + to);
        });
        hf_service.disconnect();
    }

    test_utils.assert_success(test_hf_populate.message_count);
}

test_hf_populate.add_users_contact = function()
{
    for (var i = 0; i < test_hf_populate.contact_count; i++)
    {
        var from = 0;
        var to = 0;

        while (true)
        {
            from = test_hf_populate.rand() % test_hf_populate.profile_count;
            to = test_hf_populate.rand() % test_hf_populate.profile_count;

            if (from == to)
            {
                continue;
            }

            hf_service.login_user(test_hf_populate.user_profile[from]);

            if (hf_service.is_contact(test_hf_populate.user_hash[to]))
            {
                hf_service.disconnect();
                continue;
            }

            break;
        }

        hf_service.add_contact(test_hf_populate.user_hash[to], function(success){
            test_utils.assert(success == true, 'user ' + from + ' could add user ' + to + ' as a contact');
        });
        hf_service.disconnect();
    }

    test_utils.assert_success(test_hf_populate.contact_count);
}


// ------------------------------------------------- SERVICE's TESTS ENTRY POINT

test_hf_populate.main = function()
{
    test_utils.drop_database();

    test_utils.run(test_hf_populate.create_users, 'test_hf_populate.create_users', true);
    test_utils.run(test_hf_populate.send_messages, 'test_hf_populate.send_messages', true);
    test_utils.run(test_hf_populate.add_users_contact, 'test_hf_populate.add_users_contact', true);
}
