
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

test_hf_service.add_contacts_to_circle = function()
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

    hf_service.add_contacts_to_circle([user_hash1,user_hash2], circle_hash, function(success) {
        test_utils.assert(success == true, 'hf_service.add_contacts_to_circle([user_hash1,user_hash2]) has failed');
    });

    hf_service.add_contacts_to_circle([user_hash1,user_hash2], circle_hash, function(success) {
        test_utils.assert(success == true, 'hf_service.add_contacts_to_circle([user_hash1,user_hash2]) has failed');
    });

    hf_service.add_contacts_to_circle([], circle_hash, function(success) {
        test_utils.assert(success == true, 'hf_service.add_contacts_to_circle([]) has failed');
    });

    test_utils.assert(
        hf_service.is_contact_into_circle(user_hash1, circle_hash) == true,
        'user 1 should be a contact of user 0'
    );

    test_utils.assert(
        hf_service.is_contact_into_circle(user_hash2, circle_hash) == true,
        'user 2 should be a contact of user 0'
    );

    test_utils.assert_success(6);
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

test_hf_service.list_circles_names = function()
{
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_hash0 = hf_service.create_user(user_profile0);

    hf_service.login_user(user_profile0);
    hf_service.list_circles_names(function(circles_names){
        test_utils.assert(circles_names.length == 0, 'should not have any circles names');
    });

    hf_service.create_circle('Friends', test_utils.callbackSuccess);
    hf_service.list_circles_names(function(circles_names){
        test_utils.assert(circles_names.length == 1, 'should not have one circle name');
    });

    hf_service.create_circle('Family', test_utils.callbackSuccess);
    hf_service.list_circles_names(function(circles_names){
        test_utils.assert(circles_names.length == 2, 'should not have two circles names');
    });

    test_utils.assert_success(5);
}

test_hf_service.list_circle_threads_names = function()
{
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);

    hf_service.login_user(user_profile0);
    hf_service.add_contact(user_hash1);

    var circle_hash0 = hf_service.create_circle('Friends', test_utils.callbackSuccess);

    hf_service.list_circle_threads_names(circle_hash0, function(threads_names){
        test_utils.assert(threads_names.length == 1, 'should have only one thread name');
        test_utils.assert(threads_names[0] == circle_hash0, 'the only thread name should be the circle hash');
    });

    hf_service.add_contact_to_circle(user_hash1, circle_hash0, test_utils.callbackSuccess);

    hf_service.list_circle_threads_names(circle_hash0, function(threads_names){
        test_utils.assert(threads_names.length == 1, 'should still have only one thread name');
        test_utils.assert(threads_names[0] == circle_hash0, 'the only thread name should still be the circle hash');
    });
    hf_service.disconnect();

    // user 1
    hf_service.login_user(user_profile1);
    var circle_hash1 = hf_service.create_circle('Friends', test_utils.callbackSuccess);
    var circle_hash2 = hf_service.create_circle('Family', test_utils.callbackSuccess);
    hf_service.add_contact(user_hash0, test_utils.callbackSuccess);
    hf_service.add_contact_to_circle(user_hash0, circle_hash1, test_utils.callbackSuccess);
    hf_service.add_contact_to_circle(user_hash0, circle_hash2, test_utils.callbackSuccess);
    hf_service.disconnect();

    hf_service.login_user(user_profile0);
    hf_service.pull_fresh_user_notifications();
    hf_service.list_circle_threads_names(circle_hash0, function(threads_names){
        test_utils.assert(threads_names.length == 3, 'should have two threads names');
        test_utils.assert(threads_names[0] == circle_hash0, 'the first thread name should be the circle hash');
        test_utils.assert(threads_names[1] == circle_hash1, 'the second thread name should be the user 1\'s friends circle hash');
        test_utils.assert(threads_names[2] == circle_hash2, 'the third thread name should be the user 1\'s family circle hash');
    });

    test_utils.assert_success(15);
}
