test_hf_service.search_string_pattern_users = function()
{
    //create all users
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);
    var user_profile2 = test_hf_service.john_smith_profile(2);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);
    var user_hash2 = hf_service.create_user(user_profile2);

    hf_service.search_string_pattern("",function(matching_chunks_list){
        test_utils.assert(matching_chunks_list.length == 0, 'Search empty pattern unexpected result');
    });

    hf_service.search_string_pattern("a",function(matching_chunks_list){
        test_utils.assert(matching_chunks_list.length == 2, 'Search \'a\' pattern unexpected result ' + matching_chunks_list.length);
    });

    hf_service.search_string_pattern("smith",function(matching_chunks_list){
        test_utils.assert(matching_chunks_list.length == 1, 'Search \'smith\' pattern unexpected result ' + matching_chunks_list.length);
    });

    test_utils.assert_success(3);
}

test_hf_service.search_string_pattern = function()
{
    //create all users
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);
    var user_profile2 = test_hf_service.john_smith_profile(2);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);
    var user_hash2 = hf_service.create_user(user_profile2);

    //login user
    hf_service.login_user(user_profile0, null);

    ///create groups
    var group_info0 = test_hf_service.group_examples(0);
    var group_info1 = test_hf_service.group_examples(1);
    var group_info2 = test_hf_service.group_examples(2);
    var group_info3 = test_hf_service.group_examples(3);

    hf_service.create_group(group_info0['name'],group_info0['description'],false, false);
    hf_service.create_group(group_info1['name'],group_info1['description'],true, true);
    hf_service.create_group(group_info2['name'],group_info2['description'],false, false);
    hf_service.create_group(group_info3['name'],group_info3['description'],false, true);

    hf_service.search_string_pattern("",function(matching_chunks_list){
        test_utils.assert(matching_chunks_list.length == 0, 'Search empty pattern unexpected result');
    });

    hf_service.search_string_pattern("a",function(matching_chunks_list){
        test_utils.assert(matching_chunks_list.length == 6, 'Search \'a\' pattern unexpected result ' + matching_chunks_list.length);
    });

    hf_service.search_string_pattern("aliens",function(matching_chunks_list){
        test_utils.assert(matching_chunks_list.length == 1, 'Search \'aliens\' pattern unexpected result ' + matching_chunks_list.length);
    });

    hf_service.search_string_pattern("aliensFFFFF",function(matching_chunks_list){
        test_utils.assert(matching_chunks_list.length == 0, 'Search \'aliensFFFFF\' pattern unexpected result ' + matching_chunks_list.length);
    });
    test_utils.assert_success(4);
}
