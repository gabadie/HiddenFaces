test_hf_service.discussion_names = [
    'cinema',
    'homework',
    'beer',
    'moving house',
    'present for John',
    'my birthday',
    null,
    null,
    null,
    null
];

test_hf_service.discussion_first_posts = [
    'Cassie and I are going to the cinema next friday. Would you like to come?',
    'Can we meet this we to have this huge homework done?',
    'What are you doing on friday night? Why not going out for a beer?',
    'help! I\'ve got so much stuff to move out. With your cars it would be so much easier!',
    'Hi guys. Do you have any ideas for John\'s present?',
    'You are all invited to my birthday party on friday night at my flat. Bring something to drink!',
    'Hi! How are you doing?',
    'You must watch the new season of House of Cards!',
    'Hi! How are you doing?',
    'Hi! How are you doing?'
];

test_hf_service.discussion_examples = function(id)
{
    assert(test_hf_service.discussion_names.length == test_hf_service.discussion_first_posts.length);

    id = id || 0;
    id %= test_hf_service.discussion_names.length;

    return {
        'name':   test_hf_service.discussion_names[id],
        'first_post':    test_hf_service.discussion_first_posts[id]
    }
}
//---------------------------------------------------------------------- TESTS DISCUSSIONS

test_hf_service.create_discussion = function()
{
    //user connexion
    var user_profile = test_hf_service.john_smith_profile();
    hf_service.create_user(user_profile);
    hf_service.login_user(user_profile, null);
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    //discussion creation
    hf_service.create_discussion(test_hf_service.discussion_names[0], function(discussion_hash){
        test_utils.assert(hf_service.is_discussion_hash(discussion_hash), 'Cannot create discussion');
    });

    var discussions_list = hf_service.user_private_chunk['discussions'];
    test_utils.assert(Object.keys(discussions_list).length == 1, 'No discussion had been added to user private chunk');

    test_utils.assert_success(3);
}

test_hf_service.create_discussion_posts = function()
{
    //user connexion
    var user_profile = test_hf_service.john_smith_profile();
    hf_service.create_user(user_profile);
    hf_service.login_user(user_profile, null);
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    //discussion creation
    var discussion_hash = hf_service.create_discussion(test_hf_service.discussion_names[0], function(discussion_hash0){
        test_utils.assert(hf_service.is_discussion_hash(discussion_hash0), 'Cannot create discussion');
    });

    hf_service.append_post_to_discussion('first message', discussion_hash, function(success){
        test_utils.assert(success == true, 'cannot post into discussion');
    });

    hf_service.list_posts(discussion_hash,function(posts_list){
        test_utils.assert(posts_list.length == 1, 'Nb of posts is ' + posts_list.length + ' instead of 1');
    });

    test_utils.assert_success(4);
}

test_hf_service.add_peers_to_discussion = function() {
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);
    var user_profile2 = test_hf_service.john_smith_profile(2);
    var user_profile3 = test_hf_service.john_smith_profile(3);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);
    var user_hash2 = hf_service.create_user(user_profile2);
    var user_hash3 = hf_service.create_user(user_profile3);

    hf_service.login_user(user_profile0);

    //discussion creation
    var discussion_hash = hf_service.create_discussion(test_hf_service.discussion_names[0], function(discussion_hash0){
        test_utils.assert(hf_service.is_discussion_hash(discussion_hash0), 'Cannot create discussion');
    });
    test_utils.assert(hf.is_hash(discussion_hash), 'Invalid discussion hash');

    //adding peers
    hf_service.add_peers_to_discussion(discussion_hash, [user_hash1], function(success){
        test_utils.assert(success == true,'Cannot add user_hash1 to discussion');
    });
    hf_service.add_peers_to_discussion(discussion_hash, [user_hash0], function(success){
        test_utils.assert(success == false,'Could add user_hash0 to discussion');
    });

    hf_service.disconnect();

    hf_service.login_user(user_profile1);
    hf_service.pull_fresh_user_notifications(function(success){
        test_utils.assert(success == true, 'Cannot execute automatic notifications');
    });
    hf_service.add_peers_to_discussion(discussion_hash, [user_hash2,user_hash3], function(success){
        test_utils.assert(success == true,'Cannot add user_hash2 and user_hash3 to discussion');
    });
    hf_service.list_posts(discussion_hash,function(posts_list){
        test_utils.assert(posts_list.length == 2, 'Nb of posts is ' + posts_list.length + ' instead of 2');
    });

    //verify peer list
    hf_service.list_peers(discussion_hash,function(peers_list){
        test_utils.assert(Object.keys(peers_list).length == 4, "Nb of peers is " + Object.keys(peers_list).length + " instead of 4");
    });

    hf_service.disconnect();

    hf_service.login_user(user_profile0);
    hf_service.pull_fresh_user_notifications(function(success){
        test_utils.assert(success == true, 'Cannot execute automatic notifications');
    });
    hf_service.list_peers(discussion_hash,function(peers_list){
        test_utils.assert(Object.keys(peers_list).length == 4, "Nb of peers is " + Object.keys(peers_list).length + " instead of 4");
    });
    test_utils.assert_success(10);
}

test_hf_service.peers_conversation = function() {
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);

    hf_service.login_user(user_profile0);

    //discussion creation
    var discussion_hash = hf_service.create_discussion(test_hf_service.discussion_names[0], function(discussion_hash0){
        test_utils.assert(hf_service.is_discussion_hash(discussion_hash0), 'Cannot create discussion');
    });
    test_utils.assert(hf.is_hash(discussion_hash), 'Invalid discussion hash');

    //adding peer
    hf_service.add_peers_to_discussion(discussion_hash, [user_hash1], function(success){
        test_utils.assert(success == true,'Cannot add user_hash1 to discussion');
    });

    hf_service.append_post_to_discussion('Hi! Would you like to go to the cinema on friday night?', discussion_hash, function(success){
        test_utils.assert(success == true, 'cannot post into discussion');
    });
    hf_service.disconnect();

    hf_service.login_user(user_profile1);
    hf_service.pull_fresh_user_notifications(function(success){
        test_utils.assert(success == true, 'Cannot execute automatic notifications');
    });
    hf_service.append_post_to_discussion('Yes why not!', discussion_hash, function(success){
        test_utils.assert(success == true, 'cannot post into discussion');
    });
    hf_service.disconnect();

    hf_service.login_user(user_profile0);
    hf_service.list_posts(discussion_hash,function(posts_list){
        test_utils.assert(posts_list.length == 3, 'Nb of posts is ' + posts_list.length + ' instead of 3');
    });

    test_utils.assert_success(7);
}

test_hf_service.list_discussions = function() {
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);
    var user_profile2 = test_hf_service.john_smith_profile(2);
    var user_profile3 = test_hf_service.john_smith_profile(3);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);
    var user_hash2 = hf_service.create_user(user_profile2);
    var user_hash3 = hf_service.create_user(user_profile3);

    hf_service.login_user(user_profile0);

    hf_service.list_discussions(function(discussion_map){
        test_utils.assert(Object.keys(discussion_map).length == 0, 'user has already some discussions');
    });

    //discussion creation
    var discussion_hash1 = hf_service.create_discussion(null, function(disc_hash){
        test_utils.assert(hf_service.is_discussion_hash(disc_hash), 'Cannot create discussion');
    });
    var discussion_hash0 = hf_service.create_discussion(test_hf_service.discussion_names[0], function(disc_hash){
        test_utils.assert(hf_service.is_discussion_hash(disc_hash), 'Cannot create discussion');
    });

    //adding peers
    hf_service.add_peers_to_discussion(discussion_hash1, [user_hash1,user_hash2], function(success){
        test_utils.assert(success == true,'Cannot add users to discussion 1');
    });
    hf_service.add_peers_to_discussion(discussion_hash0, [user_hash1,user_hash3], function(success){
        test_utils.assert(success == true,'Cannot add users to discussion 0');
    });

    hf_service.list_discussions(function(discussion_map){
        test_utils.assert(Object.keys(discussion_map).length == 2, 'the nb of discussions is ' + Object.keys(discussion_map).length + ' instead of 2');
        test_utils.assert(discussion_map[discussion_hash0] == test_hf_service.discussion_names[0],'wrong name for discussion 0');
        test_utils.assert(discussion_map[discussion_hash1] != null, "name for discussion 1 not computed");
        test_utils.assert(discussion_map[discussion_hash1] == (user_profile1['first_name'] + ' ' + user_profile1['last_name'] + ', (+1)'),
            "wrong name for discussion 1");
    });
    hf_service.disconnect();

    hf_service.login_user(user_profile1);
    hf_service.pull_fresh_user_notifications(function(success){
        test_utils.assert(success == true, 'Cannot execute automatic notifications');
    });
    hf_service.list_discussions(function(discussion_map){
        test_utils.assert(Object.keys(discussion_map).length == 2, 'the nb of discussions is ' + Object.keys(discussion_map).length + ' instead of 2');
        test_utils.assert(discussion_map[discussion_hash1] != null, "name for discussion 1 not computed");
        test_utils.assert(discussion_map[discussion_hash1] == (user_profile0['first_name'] + ' ' + user_profile0['last_name'] + ', (+1)'),
            "wrong name for discussion 1");
    });

    hf_service.disconnect();

    test_utils.assert_success(13);
}

test_hf_service.leave_discussion = function() {
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);
    var user_profile2 = test_hf_service.john_smith_profile(2);
    var user_profile3 = test_hf_service.john_smith_profile(3);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);
    var user_hash2 = hf_service.create_user(user_profile2);
    var user_hash3 = hf_service.create_user(user_profile3);

    hf_service.login_user(user_profile0);

    //discussion creation
    var discussion_hash = hf_service.create_discussion(test_hf_service.discussion_names[0], function(disc_hash){
        test_utils.assert(hf_service.is_discussion_hash(disc_hash), 'Cannot create discussion');
    });
    test_utils.assert(hf.is_hash(discussion_hash), 'Invalid discussion hash');

    //adding peers
    hf_service.add_peers_to_discussion(discussion_hash, [user_hash1,user_hash2,user_hash3], function(success){
        test_utils.assert(success == true,'Cannot add peers to discussion');
    });
    //verify peer list
    hf_service.list_peers(discussion_hash,function(peers_list){
        test_utils.assert(Object.keys(peers_list).length == 4, "Nb of peers is " + Object.keys(peers_list).length + " instead of 4");
    });

    hf_service.disconnect();

    hf_service.login_user(user_profile1);
    hf_service.pull_fresh_user_notifications(function(success){
        test_utils.assert(success == true, 'Cannot execute automatic notifications');
    });
    hf_service.leave_discussion(discussion_hash,function(success){
        test_utils.assert(success == true, 'Cannot leave group');
    });
    hf_service.list_discussions(function(discussion_map){
        test_utils.assert(Object.keys(discussion_map).length == 0, 'the nb of discussions is ' + Object.keys(discussion_map).length + ' instead of 0');
    });

    hf_service.disconnect();

    hf_service.login_user(user_profile2);
    hf_service.pull_fresh_user_notifications(function(success){
        test_utils.assert(success == true, 'Cannot execute automatic notifications');
    });
    hf_service.list_peers(discussion_hash,function(peers_list){
        test_utils.assert(Object.keys(peers_list).length == 3, "Nb of peers is " + Object.keys(peers_list).length + " instead of 3");
    });
    test_utils.assert_success(9);
}
