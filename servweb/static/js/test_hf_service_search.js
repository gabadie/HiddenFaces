test_hf_service.search_string_pattern = function()
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
        test_utils.assert(matching_chunks_list.length == 2, 'Search \'a\' pattern unexpected result');
    });

    hf_service.search_string_pattern("smith",function(matching_chunks_list){
        test_utils.assert(matching_chunks_list.length == 1, 'Search \'smith\' pattern unexpected result');
    });

    test_utils.assert_success(3);
}
