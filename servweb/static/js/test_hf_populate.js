
test_hf_populate = {};

test_hf_populate.profile_count = 32;
test_hf_populate.circle_count = 2;
test_hf_populate.message_count = 100;
test_hf_populate.symetric_contact_count = 200;
test_hf_populate.asymetric_contact_count = 200;
test_hf_populate.post_count = 200;


test_hf_populate.seed = 0;

test_hf_populate.rand = function()
{
    test_hf_populate.seed = (test_hf_populate.seed * 22695477 + 1) & 0xFFFFFFFF;
    return (test_hf_populate.seed >>> 0x10) & 0x7FFF;
}

test_hf_populate.rand_user_id = function()
{
    return test_hf_populate.rand() % test_hf_populate.profile_count;
}

test_hf_populate.create_users = function()
{
    test_hf_populate.user_profile = [];
    test_hf_populate.user_hash = [];

    test_hf_populate.user_profile[0] = test_hf_service.john_smith_profile(0);

    var generated_profile_ids = [0];

    for (var i = 1; i < test_hf_populate.profile_count; i++)
    {
        var user_profile_id = 0;

        while (generated_profile_ids.indexOf(user_profile_id) >= 0)
        {
            user_profile_id = test_hf_populate.rand() % 256;
        }

        generated_profile_ids.push(user_profile_id);

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
        hf_service.list_circles(function(circles_list){
            test_utils.assert(
                circles_list.length == test_hf_populate.circle_count,
                'failed to list prolfile ' + i + '\' circles'
            );
        });
        hf_service.disconnect();
    }

    test_utils.assert_success(test_hf_populate.profile_count * 4);
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

test_hf_populate.add_symetric_users_contacts = function()
{
    for (var i = 0; i < test_hf_populate.symetric_contact_count; i++)
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

        var circle_id = 1;

        if (test_hf_populate.user_profile[to]['last_name'] == test_hf_populate.user_profile[from]['last_name'])
        {
            circle_id = 0;
        }

        // user from
        hf_service.list_circles(function(circles_list){
            test_utils.assert(
                circles_list.length == test_hf_populate.circle_count,
                'failed to list prolfile ' + from + '\'s circles'
            );

            circle_hash = circles_list[circle_id]['thread_chunk_name'];
        });
        hf_service.add_contact(test_hf_populate.user_hash[to], test_utils.callbackSuccess);
        hf_service.add_contact_to_circle(
            test_hf_populate.user_hash[to],
            circle_hash,
            test_utils.callbackSuccess
        );
        hf_service.disconnect();

        // user to
        hf_service.login_user(test_hf_populate.user_profile[to]);
        hf_service.list_circles(function(circles_list){
            test_utils.assert(
                circles_list.length == test_hf_populate.circle_count,
                'failed to list prolfile ' + to + '\'s circles'
            );

            circle_hash = circles_list[circle_id]['thread_chunk_name'];
        });
        hf_service.add_contact(test_hf_populate.user_hash[from], test_utils.callbackSuccess);
        hf_service.add_contact_to_circle(
            test_hf_populate.user_hash[from],
            circle_hash,
            test_utils.callbackSuccess
        );
        hf_service.disconnect();
    }

    test_utils.assert_success(6 * test_hf_populate.symetric_contact_count);
}

test_hf_populate.add_asymetric_users_contacts = function()
{
    for (var i = 0; i < test_hf_populate.asymetric_contact_count; i++)
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

        var circle_id = 1;

        hf_service.get_user_public_chunk(test_hf_populate.user_hash[to], function(public_chunk){
            if (public_chunk['profile']['last_name'] == hf_service.user_private_chunk['profile']['last_name'])
            {
                circle_id = 0;
            }
        });

        hf_service.list_circles(function(circles_list){
            test_utils.assert(
                circles_list.length == test_hf_populate.circle_count,
                'failed to list prolfile ' + from + '\'s circles'
            );

            var circle_hash = circles_list[circle_id]['thread_chunk_name'];

            hf_service.add_contact_to_circle(
                test_hf_populate.user_hash[to],
                circle_hash,
                test_utils.callbackSuccess
            );
        });

        hf_service.disconnect();
    }

    test_utils.assert_success(3 * test_hf_populate.asymetric_contact_count);
}

test_hf_populate.post_into_circle = function()
{
    for (var i = 0; i < test_hf_populate.post_count; i++)
    {
        var user_id = test_hf_populate.rand_user_id();

        hf_service.login_user(test_hf_populate.user_profile[user_id]);

        var circle_id = test_hf_populate.rand() % test_hf_populate.circle_count;
        var circle_hash = null;

        hf_service.list_circles(function(circles_list){
            test_utils.assert(
                circles_list.length == test_hf_populate.circle_count,
                'failed to list prolfile ' + user_id + '\'s circles'
            );

            circle_hash = circles_list[circle_id]['thread_chunk_name'];

            test_utils.assert(
                hf.is_hash(circle_hash),
                'user ' + user_id + '\'s circle hash is not a hash'
            );
        });

        assert(circle_hash != null);

        var message = 'Hey guys, I bought ' + i + ' bananas. Feel free to come over!';
        var thread_info = {
            'thread_chunk_name': circle_hash,
            'symetric_key': hf_service.get_encryption_key(hf_service.user_private_chunk, circle_hash)
        };

        hf_service.create_post(message, [thread_info], function(success){
            test_utils.assert(
                success == true,
                'post ' + user_id + '\'s creation should success'
            );
        });

        hf_service.disconnect();
    }

    test_utils.assert_success(test_hf_populate.post_count * 3);
}

test_hf_populate.pull_fresh_notifications = function()
{
    for (var i = 0; i < test_hf_populate.profile_count; i++)
    {
        hf_service.login_user(test_hf_populate.user_profile[i]);
        hf_service.pull_fresh_notifications(test_utils.callbackSuccess);
        hf_service.disconnect();
    }

    test_utils.assert_success(test_hf_populate.profile_count);
}


// ------------------------------------------------- SERVICE's TESTS ENTRY POINT

test_hf_populate.main = function()
{
    test_utils.drop_database();

    test_utils.run(test_hf_populate.create_users, 'test_hf_populate.create_users', true);
    test_utils.run(test_hf_populate.send_messages, 'test_hf_populate.send_messages', true);
    test_utils.run(test_hf_populate.add_symetric_users_contacts, 'test_hf_populate.add_symetric_users_contacts', true);
    test_utils.run(test_hf_populate.add_asymetric_users_contacts, 'test_hf_populate.add_asymetric_users_contacts', true);
    test_utils.run(test_hf_populate.post_into_circle, 'test_hf_populate.post_into_circle', true);
    test_utils.run(test_hf_populate.pull_fresh_notifications, 'test_hf_populate.pull_fresh_notifications', true);
}
