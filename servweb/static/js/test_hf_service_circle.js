
test_hf_service.create_circle = function()
{
    var user_profile0 = test_hf_service.john_smith_profile();

    hf_service.create_user(user_profile0);
    hf_service.login_user(user_profile0);

    hf_service.create_circle('INSA Lyon', function(success) {
        test_utils.assert(success == true, 'hf_service.create_circle() 1 has failed');
    });

    hf_service.create_circle('IF Promoyion 2015', function(success) {
        test_utils.assert(success == true, 'hf_service.create_circle() 2 has failed');
    });

    test_utils.assert_success(2);
}

test_hf_service.add_contact_to_circle = function()
{
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);
    var user_profile2 = test_hf_service.john_smith_profile(2);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);
    var user_hash2 = hf_service.create_user(user_profile2);

    hf_service.login_user(user_profile0);
    hf_service.add_contact(user_hash1);
    hf_service.add_contact(user_hash2);

    var circle_hash = hf_service.create_circle('INSA Lyon', function(success) {
        test_utils.assert(success == true, 'hf_service.create_circle() has failed');
    });

    hf_service.add_contact_to_circle(user_hash1, circle_hash, function(success) {
        test_utils.assert(success == true, 'hf_service.add_contact_to_circle() 1 has failed');
    });

    hf_service.add_contact_to_circle(user_hash1, circle_hash, function(success) {
        test_utils.assert(success == false, 'hf_service.add_contact_to_circle() 2 has successed');
    });

    hf_service.add_contact_to_circle(user_hash2, circle_hash, function(success) {
        test_utils.assert(success == true, 'hf_service.add_contact_to_circle() 3 has failed');
    });

    test_utils.assert_success(4);
}

test_hf_service.is_contact_into_circle = function()
{
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);
    var user_profile2 = test_hf_service.john_smith_profile(2);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);
    var user_hash2 = hf_service.create_user(user_profile2);

    hf_service.login_user(user_profile0);
    hf_service.add_contact(user_hash1);
    hf_service.add_contact(user_hash2);

    var circle_hash = hf_service.create_circle('Friends', function(success) {
        test_utils.assert(success == true, 'hf_service.create_circle() has failed');
    });

    test_utils.assert(
        hf_service.is_contact_into_circle(user_hash1, circle_hash) == false,
        'user 1 should not be a contact of user 0'
    );
    test_utils.assert(
        hf_service.is_contact_into_circle(user_hash2, circle_hash) == false,
        'user 2 should not be a contact of user 0'
    );

    hf_service.add_contact_to_circle(user_hash1, circle_hash, function(success){
        test_utils.assert(success == true, 'adding user 1 into circle should success');
    });

    test_utils.assert(
        hf_service.is_contact_into_circle(user_hash1, circle_hash) == true,
        'user 1 should be a contact of user 0'
    );
    test_utils.assert(
        hf_service.is_contact_into_circle(user_hash2, circle_hash) == false,
        'user 2 should still not to be a contact of user 0'
    );

    test_utils.assert_success(6);
}

test_hf_service.list_circles = function()
{
    var user_profile0 = test_hf_service.john_smith_profile();

    hf_service.create_user(user_profile0);
    hf_service.login_user(user_profile0);

    hf_service.list_circles(function(circles_list){
        test_utils.assert(circles_list.length == 0, 'circles list should not have any circle');
    });

    hf_service.create_circle('INSA Lyon', function(success) {
        test_utils.assert(success == true, 'hf_service.create_circle() 1 has failed');
    });

    hf_service.list_circles(function(circles_list){
        test_utils.assert(circles_list.length == 1, 'circles list should have 1 circle');
    });

    hf_service.create_circle('IF Promoyion 2015', function(success) {
        test_utils.assert(success == true, 'hf_service.create_circle() 2 has failed');
    });

    hf_service.list_circles(function(circles_list){
        test_utils.assert(circles_list.length == 2, 'circles list should have 2 circles');
    });

    hf_service.disconnect();
    hf_service.login_user(user_profile0);

    hf_service.list_circles(function(circles_list){
        test_utils.assert(circles_list.length == 2, 'circles list should still have 2 circles');
    });

    test_utils.assert_success(6);
}
