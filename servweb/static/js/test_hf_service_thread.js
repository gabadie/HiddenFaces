// ------------------------------------------------------- THREADS & POSTS TESTS

test_hf_service.post_message = function()
{
    var user_profile = test_hf_service.john_smith_profile();
    hf_service.create_user(user_profile);

    //user connexion
    hf_service.login_user(user_profile, null);
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    //post creation
    var post_content = test_hf_service.user_example_post();
    hf_service.create_post(post_content, null,function(post_info){
        test_utils.assert(post_info['status'] == "ok");
        test_utils.assert(typeof post_info['post_chunk_name'] == "string");
        test_utils.assert(typeof post_info['symetric_key'] == "string");
    });

    test_utils.assert_success(4);
}

test_hf_service.create_thread = function()
{
    var user_profile = test_hf_service.john_smith_profile();
    hf_service.create_user(user_profile);

    var owner_hash = hf.generate_hash("cWDb8suW3i");

    //user connexion
    hf_service.login_user(user_profile, null);
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    hf_service.create_thread(owner_hash,true,true,function(thread_info){
        test_utils.assert(thread_info['status'] == "ok");
        test_utils.assert(typeof thread_info['thread_chunk_name'] == "string");
        test_utils.assert(typeof thread_info['symetric_key'] == "string");
    });

    test_utils.assert_success(4);
}

test_hf_service.append_post_to_threads = function()
{
    var threads_list = test_utils.threads_example();

    //post creation directly appended to threads
    var post_content = test_hf_service.user_example_post();
    hf_service.create_post(post_content,threads_list, function(success){
            test_utils.assert(success);
        });

    //verification threads' content
    for(var i = 0; i < threads_list.length; i++){
        hf_com.get_data_chunk(
            threads_list[i]['thread_chunk_name'],
            threads_list[i]['symetric_key'],
            function(json_message){
                test_utils.assert(json_message['chunk_content'].length == 1);
            });
    }

    test_utils.assert_success(6 + threads_list.length);
}

test_hf_service.list_posts_thread = function()
{
    var user_profile = test_hf_service.john_smith_profile();
    hf_service.create_user(user_profile);

    var owner_hash = hf.generate_hash("cWDb8suW3i");

    //user connexion
    hf_service.login_user(user_profile, null);
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    var thread1_info = null;

    //threads list creation
    hf_service.create_thread(owner_hash,true,true,function(thread_info){
            test_utils.assert(thread_info['status'] == "ok");
            thread1_info = thread_info;
        });
    //store key
    hf_service.store_key(hf_service.user_private_chunk, thread1_info['thread_chunk_name'], thread1_info['symetric_key']);

    test_utils.assert(thread1_info != null);
    var threads_list = [thread1_info];

    //posts creation directly appended to threads
    var post_content = test_hf_service.user_example_post();
    hf_service.create_post(post_content,threads_list, function(success){
            test_utils.assert(success);
        });

    hf.sleep(2 * 1000);

    hf_service.create_post("fake_post",threads_list, function(success){
            test_utils.assert(success);
        });

    //get list of posts
    hf_service.list_posts(
        thread1_info['thread_chunk_name'],
        function(resolved_posts){
            test_utils.assert(resolved_posts != null);
            test_utils.assert(resolved_posts.length == 2);

            test_utils.assert(resolved_posts[0]['date'] > resolved_posts[1]['date']);
        });

    test_utils.assert_success(8);
}

test_hf_service.merge_posts_lists = function()
{
    var user_profile = test_hf_service.john_smith_profile();

    var owner_hash = hf.generate_hash("cWDb8suW3i");

    hf_service.create_user(user_profile);
    hf_service.login_user(user_profile);

    var thread0 = hf_service.create_thread(owner_hash, true, true);
    var thread1 = hf_service.create_thread(owner_hash, true, true);
    var thread2 = hf_service.create_thread(owner_hash, true, true);

    hf_service.create_post("fake_post 1", [thread0], function(success){
        test_utils.assert(success);
    });

    hf.sleep(2 * 1000);

    hf_service.create_post("fake_post 2", [thread1, thread2], function(success){
        test_utils.assert(success);
    });

    hf.sleep(2 * 1000);

    hf_service.create_post("fake_post 3", [thread2], function(success){
        test_utils.assert(success);
    });

    hf.sleep(2 * 1000);

    hf_service.create_post("fake_post 4", [thread0, thread1], function(success){
        test_utils.assert(success);
    });

    test_utils.assert_success(4);

    var thread0_posts = hf_service.list_posts(thread0['thread_chunk_name']);
    var thread1_posts = hf_service.list_posts(thread1['thread_chunk_name']);
    var thread2_posts = hf_service.list_posts(thread2['thread_chunk_name']);

    var posts = hf_service.merge_posts_lists([
        thread0_posts,
        thread1_posts,
        thread2_posts
    ]);

    test_utils.assert(posts.length == 4, 'invalid posts.length (duplicated ?)');

    for (var i = 1; i < posts.length; i++)
    {
        test_utils.assert(
            posts[i - 1]['date'] > posts[i]['date'],
            posts[i]['content'] + ' should be bebore ' + posts[i - 1]['content']
        );
    }
}

test_hf_service.comment_post = function()
{

    var user_profile1 = test_hf_service.john_smith_profile();
    hf_service.create_user(user_profile1);

    var user_profile2 = test_hf_service.john_smith_profile(1);
    hf_service.create_user(user_profile2);

    //user1 connexion
    hf_service.login_user(user_profile1);
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    //post creation
    var post_content = test_hf_service.user_example_post();
    hf_service.create_post(post_content, null,function(post_info){
        test_utils.assert(post_info['status'] == "ok");
        test_utils.assert(typeof post_info['post_chunk_name'] == "string");
        test_utils.assert(typeof post_info['symetric_key'] == "string");

        //user1 comment post user1
        var comment = "user1 comment";
        hf_service.comment_post(post_info['post_chunk_name'],post_info['symetric_key'],comment,function(success){
            test_utils.assert(success == true);
        });
        hf_service.disconnect();

        // user2 connexion
        hf_service.login_user(user_profile2);
        test_utils.assert(hf_service.is_connected(), 'should be connected after');

        //user2 comment post user1
        comment = "user2 comment";
        hf_service.comment_post(post_info['post_chunk_name'],post_info['symetric_key'],comment,function(success){
            test_utils.assert(success == true);
        });

        //verify post content
        hf_com.get_data_chunk(
            post_info['post_chunk_name'],
            post_info['symetric_key'],
            function(json_message){
                test_utils.assert(json_message['chunk_content'].length == 3);

                var post_json = JSON.parse(json_message['chunk_content'][0]);
                test_utils.assert(post_json['__meta']['type'] == '/post');

                for(var i = 1; i < json_message['chunk_content'].length; i++){
                    var comment_json = JSON.parse(json_message['chunk_content'][i])
                    test_utils.assert(comment_json['__meta']['type'] == '/comment');
                }
            }
        );
    }); 

    test_utils.assert_success(11);
}