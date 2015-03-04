// -------------------------------------------------------------------------- CHUNKS CERTIFICATION

test_hf_service.verify_certification = function()
{
    var user_profile = test_hf_service.john_smith_profile();
    hf_service.create_user(user_profile);

    //user connexion
    hf_service.login_user(user_profile, null);
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    var certificate_repository = hf_service.user_private_chunk;
    var data_chunk_name = hf.generate_hash('YSDYgVMcLGCDdnmQc6F7');
    var data_chunk_part1 = hf.generate_hash('ASlWSclt2P3dkES3uI7f');
    var data_chunk_part2 = hf.generate_hash('XLVO5Awki99QCRHXigBF');
    var data_hash1 = hf.generate_hash('jKWngYuo0FitkO1gEUPK');
    var data_hash2 = hf.generate_hash('z4w60VarHonFH9oQhr44');

    hf_service.certify(certificate_repository, data_chunk_name, data_chunk_part1, data_hash1, function(success){
        test_utils.assert(success == true,"Cannot certify data_chunk_part1 in test_hf_service.verify_certification");
    });
    hf_service.certify(certificate_repository, data_chunk_name, data_chunk_part2, data_hash2, function(success){
        test_utils.assert(success == true,"Cannot certify data_chunk_part2 in test_hf_service.verify_certification");
    });

    hf_service.verify_certification(certificate_repository, data_chunk_name, data_chunk_part1, data_hash1, function(success){
        test_utils.assert(success == true,"data_chunk_part1 has no certification in test_hf_service.verify_certification");
    });
    hf_service.verify_certification(certificate_repository, data_chunk_name, data_chunk_part2, data_hash2, function(success){
        test_utils.assert(success == true,"data_chunk_part2 has no certification in test_hf_service.verify_certification");
    });
    test_utils.assert_success(5);
}

test_hf_service.verify_post_certification = function()
{
    var user_profile = test_hf_service.john_smith_profile();
    hf_service.create_user(user_profile);

    //user connexion
    hf_service.login_user(user_profile, null);
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    //post creation
    var post_content = test_hf_service.user_example_post();
    var post_chunk_name = null;
    var post_chunk_key = null;
    hf_service.create_post(post_content, null,function(post_info){
            test_utils.assert(post_info['status'] == "ok");
            post_chunk_name = post_info['post_chunk_name'];
            post_chunk_key = post_info['symetric_key'];
        });
    test_utils.assert(post_chunk_key != null);
    test_utils.assert(post_chunk_name != null);

    //verification
    var certificate_repository = hf_service.user_private_chunk;
    var post_list_content = null;
    hf_com.get_data_chunk(
        post_chunk_name,
        post_chunk_key,
        function(json_message){
            post_list_content = json_message['chunk_content'];
        }
    );
    test_utils.assert(post_list_content != null);

    var element_json = JSON.parse(post_list_content[0]);
    hf_service.verify_certification(certificate_repository, post_chunk_name, element_json['__meta']['part_hash'], hf.hash(post_list_content[0]), function(success){
        test_utils.assert(success == true, "chunk verification failed");
    });

    test_utils.assert_success(6);
}

test_hf_service.verify_append_posts_certification = function()
{
    //get list threads example
    var threads_list = test_utils.threads_example();

    //append posts to threads
    var post_content = test_hf_service.user_example_post();
    hf_service.create_post(post_content,threads_list, function(success){
            test_utils.assert(success);
        });
    hf_service.create_post('fake post',[threads_list[0]], function(success){
            test_utils.assert(success);
        });

    //loop over threads
    for(var i = 0; i < threads_list.length; i++){

        //get thread
        hf_com.get_data_chunk(
            threads_list[i]['thread_chunk_name'],
            threads_list[i]['symetric_key'],
            function(json_message){

                test_utils.assert('chunk_content' in json_message);
                thread_list_posts = json_message['chunk_content'];

                //loop over thread's posts
                for(var j = 0; j < thread_list_posts.length; j++){

                    //get post informations
                    var json_post_info = JSON.parse(thread_list_posts[j]);
                    test_utils.assert("post_chunk_name" in json_post_info);
                    test_utils.assert("symetric_key" in json_post_info);

                    //get post content
                    hf_com.get_data_chunk(
                        json_post_info['post_chunk_name'],
                        json_post_info['symetric_key'],
                        function(json_message){

                            test_utils.assert(json_message['chunk_content'][0] !== 'undefined');
                            var element_json = JSON.parse(json_message['chunk_content'][0]);

                            //get post's part_hash
                            test_utils.assert(element_json['__meta']['type'] == '/post');
                            var post_part_hash = element_json['__meta']['part_hash'];

                            //verify current user has the certification for the post's append
                            hf_service.verify_certification(
                                hf_service.user_private_chunk, 
                                threads_list[i]['thread_chunk_name'], 
                                post_part_hash, 
                                hf.hash(thread_list_posts[j]), 
                                function(success){
                                    test_utils.assert(success == true, "Cannot verify certification post-thread")
                                });
                        });
                }
            });
    }

    test_utils.assert_success(7 + threads_list.length + 5 * (threads_list.length + 1));
}

test_hf_service.verify_comment_certification = function()
{
    var user_profile = test_hf_service.john_smith_profile();
    hf_service.create_user(user_profile);

    //user1 connexion
    hf_service.login_user(user_profile);
    test_utils.assert(hf_service.is_connected(), 'should be connected after');

    //post creation
    var post_content = test_hf_service.user_example_post();
    hf_service.create_post(post_content, null,function(post_info){
        test_utils.assert(post_info['status'] == "ok");
        post_chunk_name = post_info['post_chunk_name'];
        post_chunk_key = post_info['symetric_key'];
    });
    test_utils.assert(post_chunk_key != null);
    test_utils.assert(post_chunk_name != null);

    //comment post
    var comment = "user1 comment";
    hf_service.comment_post(post_chunk_name,post_chunk_key,comment,function(success){
        test_utils.assert(success == true);
    });

    //verification
    var certificate_repository = hf_service.user_private_chunk;
    var post_list_content = null;
    hf_com.get_data_chunk(
        post_chunk_name,
        post_chunk_key,
        function(json_message){
            post_list_content = json_message['chunk_content'];
        }
    );
    test_utils.assert(post_list_content != null);

    for(var i = 0; i < post_list_content.length; i++){
        var element_json = JSON.parse(post_list_content[i]);
        hf_service.verify_certification(certificate_repository, post_chunk_name, element_json['__meta']['part_hash'], hf.hash(post_list_content[i]), function(success){
            test_utils.assert(success == true, "chunk verification failed");
        });
    }

    test_utils.assert_success(6 + post_list_content.length);
}