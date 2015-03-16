
test_hf_populate = {};

test_hf_populate.profile_count = 32;
test_hf_populate.circle_count = 2;
test_hf_populate.message_count = 100;
test_hf_populate.symetric_contact_count = 200;
test_hf_populate.asymetric_contact_count = 200;
test_hf_populate.post_count = 200;
test_hf_populate.comment_count = 300;
test_hf_populate.group_count = 12;
test_hf_populate.subscription_count = 10;
test_hf_populate.users_group_count = 10;


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

test_hf_populate.profile_picture_links = [
    'http://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Rabbit_in_montana.jpg/270px-Rabbit_in_montana.jpg',
    'http://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Kitten_in_Rizal_Park%2C_Manila.jpg/160px-Kitten_in_Rizal_Park%2C_Manila.jpg',
    'http://upload.wikimedia.org/wikipedia/commons/thumb/9/94/My_dog.jpg/320px-My_dog.jpg',
    'http://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Goldfish3.jpg/224px-Goldfish3.jpg'
]

test_hf_populate.create_users = function()
{
    test_hf_populate.user_profile = [];
    test_hf_populate.user_hash = [];
    test_hf_populate.user_id = [];

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
    }

    for (var i = 0; i < test_hf_populate.profile_count; i++)
    {
        var picture_id = test_hf_populate.rand() % test_hf_populate.profile_picture_links.length;

        test_hf_populate.user_hash[i] = hf_service.create_user(test_hf_populate.user_profile[i], function(user_hash){
            test_utils.assert(user_hash != null, 'failed to create profile ' + i);
        });

        hf_service.login_user(test_hf_populate.user_profile[i]);

        hf_service.user_private_chunk['profile']['picture'] = test_hf_populate.profile_picture_links[picture_id];

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

        test_hf_populate.user_id[test_hf_populate.user_hash[i]] = i;
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

test_hf_populate.create_groups = function()
{
    test_hf_populate.groups_hash_and_admin = {};
    for (var i = 0; i < test_hf_populate.group_count; i++)
    {
        var user_id = test_hf_populate.rand_user_id();
        hf_service.login_user(test_hf_populate.user_profile[user_id]);

        var group_info = test_hf_service.group_examples(i);

        hf_service.create_group(
            group_info['name'],
            group_info['description'],
            i < test_hf_populate.group_count / 4, i < test_hf_populate.group_count / 2,
            function(group_hash){
                test_utils.assert(hf.is_hash(group_hash),'Cannot create group');
                test_utils.assert(hf_service.is_group_admin(group_hash));
                test_hf_populate.groups_hash_and_admin[group_hash] = user_id;
            }
        );

        hf_service.disconnect();
    }
    test_utils.assert(Object.keys(test_hf_populate.groups_hash_and_admin).length == test_hf_populate.group_count,
        'Not all the groups have been created'
    );
    test_utils.assert_success(2 * test_hf_populate.group_count + 1);
}

test_hf_populate.subscription_requests = function()
{
    var subscription_message = 'I would like to subscribe to this group';
    for(var group_hash in test_hf_populate.groups_hash_and_admin){

        var subscribers_id = [test_hf_populate.groups_hash_and_admin[group_hash]];

        for (var i = 0; i < test_hf_populate.subscription_count; i++)
        {
            var from = test_hf_populate.groups_hash_and_admin[group_hash];

            while(subscribers_id.indexOf(from) >= 0){
                from = test_hf_populate.rand() % test_hf_populate.profile_count;
            }

            subscribers_id.push(from);

            hf_service.login_user(test_hf_populate.user_profile[from]);

            hf_service.subscribe_to_group(group_hash, subscription_message, function(success){
                test_utils.assert(success == true,
                    test_hf_populate.user_profile[from]['first_name']+' cannot subscribe to the group '
                );
            });

            hf_service.disconnect();
        }
    }

    test_utils.assert_success(test_hf_populate.users_group_count * test_hf_populate.group_count);
}

test_hf_populate.add_users_to_groups = function()
{
    for(var group_hash in test_hf_populate.groups_hash_and_admin){

        var users_id = [test_hf_populate.groups_hash_and_admin[group_hash]];
        hf_service.login_user(test_hf_populate.user_profile[test_hf_populate.groups_hash_and_admin[group_hash]]);

        for (var i = 0; i < test_hf_populate.users_group_count; i++)
        {
            var user_id = test_hf_populate.groups_hash_and_admin[group_hash];

            while(users_id.indexOf(user_id) >= 0){
                user_id = test_hf_populate.rand() % test_hf_populate.profile_count;
            }

            users_id.push(user_id);

            hf_service.add_user_to_group(test_hf_populate.user_hash[user_id], group_hash, function(success){
                test_utils.assert(success == true,
                'Cannot add'+test_hf_populate.user_profile[user_id]['first_name']+' to group')
            });
        }

        hf_service.disconnect();
    }
    test_utils.assert_success(test_hf_populate.group_count * test_hf_populate.users_group_count);
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

        hf_service.create_post(message, [thread_info], function(json_message){
            test_utils.assert(
                json_message != null,
                'post ' + user_id + '\'s creation should success'
            );
        });

        hf_service.disconnect();
    }

    test_utils.assert_success(test_hf_populate.post_count * 3);
}

test_hf_populate.comment_posts = function()
{
    var assert_count = 2 * test_hf_populate.comment_count;

    for (var i = 0; i < test_hf_populate.comment_count; i++)
    {
        var circle_hash = null;
        var posts_refs_list = null;
        var user_id = null;

        while (user_id == null)
        {
            var post_owner_id = test_hf_populate.rand_user_id();
            var circles_list = null;

            hf_service.login_user(test_hf_populate.user_profile[post_owner_id]);
            hf_service.list_circles(function(json_message){
                test_utils.assert(
                    json_message.length == test_hf_populate.circle_count,
                    'failed to list prolfile ' + post_owner_id + '\'s circles'
                );
                circles_list = json_message;
            });
            assert(circles_list != null);

            var circle_id = test_hf_populate.rand() % circles_list.length;
            var circle_infos = circles_list[circle_id];

            if (circle_infos['contacts'].length == 0)
            {
                hf_service.disconnect();
                assert_count += 1;
                continue;
            }

            circle_hash = circle_infos['thread_chunk_name'];

            assert(
                hf.is_hash(circle_hash),
                'user ' + post_owner_id + '\'s circle hash is not a hash'
            );

            var circle_key = hf_service.get_encryption_key(hf_service.user_private_chunk, circle_hash);

            hf_com.get_data_chunk(circle_hash,circle_key,function(thread_json_message){
                assert(thread_json_message['status'] == 'ok');

                posts_refs_list = thread_json_message['chunk_content'];
            });
            assert(posts_refs_list != null);

            if (posts_refs_list.length == 0)
            {
                hf_service.disconnect();
                assert_count += 1;
                continue;
            }

            var contact_user_id = test_hf_populate.rand() % circle_infos['contacts'].length;
            var contact_user_hash = circle_infos['contacts'][contact_user_id];
            var user_id = test_hf_populate.user_id[contact_user_hash];

            hf_service.disconnect();
        }

        assert(circle_hash != null);
        assert(posts_refs_list != null);
        assert(user_id != null);

        var comment = 'Cool! I feel like eating ' + i + ' bananas today. I\'ll be there ASAP!';

        var post_id = test_hf_populate.rand() % posts_refs_list.length;
        var post_info_json = JSON.parse(posts_refs_list[post_id]);

        hf_service.login_user(test_hf_populate.user_profile[user_id]);
        hf_service.comment_post(
            post_info_json['post_chunk_name'],
            post_info_json['symetric_key'],
            comment,
            function(success){
                test_utils.assert(
                    success == true,
                    'User '+user_id+' cannot comment post '+post_info_json['post_chunk_name']
                );
            }
        );
        hf_service.disconnect();
    }

    test_utils.assert_success(assert_count);
}

test_hf_populate.post_into_group = function()
{
    for (var i = 0; i < test_hf_populate.post_count; i++)
    {
        var user_id = test_hf_populate.rand_user_id();

        hf_service.login_user(test_hf_populate.user_profile[user_id]);

        var group_chunk = null;

        hf_service.list_groups(function(groups_list){
            var nb_groups = groups_list.length;

            if(nb_groups > 0){
                var group_id = test_hf_populate.rand() % nb_groups;
                group_chunk = groups_list[group_id];

                test_utils.assert(
                    hf.is_hash(group_chunk['__meta']['group_hash']),
                    'user ' + user_id + '\'s group hash is not a hash'
                );
            }
        });

        if(group_chunk != null){
            var group_hash = group_chunk['__meta']['group_hash'];
            var message = 'Hey guys, what\'s new about ' + group_chunk['group']['name'] + '? ' + i + ' thanx XD';

            hf_service.get_thread_infos(group_hash,function(thread_info){
                if(thread_info !== null){
                    test_utils.assert('name' in thread_info,'thread info doesn\'t contain name field');
                    test_utils.assert('key' in thread_info,'thread info doesn\'t contain name field');

                    var thread_json = {
                        'thread_chunk_name': thread_info['name'],
                        'symetric_key': thread_info['key']
                    };
                    hf_service.create_post(message, [thread_json], function(json_message){
                        test_utils.assert(
                            json_message != null,
                            'post ' + user_id + '\'s creation should success'
                        );
                    });
                }
            });
        }

        hf_service.disconnect();
    }
}

test_hf_populate.pull_fresh_user_notifications = function()
{
    for (var i = 0; i < test_hf_populate.profile_count; i++)
    {
        hf_service.login_user(test_hf_populate.user_profile[i]);
        hf_service.pull_fresh_user_notifications(test_utils.callbackSuccess);
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
    test_utils.run(test_hf_populate.create_groups,'test_hf_populate.create_groups',true);
    test_utils.run(test_hf_populate.subscription_requests,'test_hf_populate.subscription_requests',true);
    test_utils.run(test_hf_populate.add_users_to_groups,'test_hf_populate.add_users_to_groups',true);
    test_utils.run(test_hf_populate.post_into_circle, 'test_hf_populate.post_into_circle', true);
    test_utils.run(test_hf_populate.comment_posts,'test_hf_populate.comment_posts',true);
    test_utils.run(test_hf_populate.pull_fresh_user_notifications, 'test_hf_populate.pull_fresh_user_notifications', true);
    test_utils.run(test_hf_populate.post_into_group, 'test_hf_populate.post_into_group', true);
}
