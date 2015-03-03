
var test_hf = {};


// --------------------------------------------------- BASIC RAND TO GENERATE DB

test_hf.seed = 0;

test_hf.rand = function()
{
    test_hf.seed = (test_hf.seed * 22695477 + 1) & 0xFFFFFFFF;
    return (test_hf.seed >>> 0x10) & 0x7FFF;
}


// ----------------------------------------------------------------- POPULATE DB

test_hf.populate_db = function()
{
    test_utils.drop_database();

    // ------------------------------------------------------------ CREATE USERS
    var profile_count = 32;
    var user_profile = [];
    var user_hash = [];

    user_profile[0] = test_hf_service.john_smith_profile(0);

    for (var i = 1; i < profile_count; i++)
    {
        var user_profile_id = test_hf.rand() % 256;
        user_profile[i] = test_hf_service.john_smith_profile(user_profile_id);

        // avoid private chunk colision
        user_profile[i]['password'] = 'password' + i;
    }

    for (var i = 0; i < profile_count; i++)
    {
        user_hash[i] = hf_service.create_user(user_profile[i], function(user_hash){
            test_utils.assert(user_hash != null, 'failed to create profile ' + i);
        });

        hf_service.login_user(user_profile[i]);
        hf_service.create_circle('Family', function(success){
            test_utils.assert(success == true, 'failed to create profile ' + i + '\'s family circle');
        });
        hf_service.create_circle('Friends', function(success){
            test_utils.assert(success == true, 'failed to create profile ' + i + '\'s friends circle');
        });
        hf_service.disconnect();
    }

    test_utils.assert_success(profile_count * 3);

    // ---------------------------------------------------------- SENDS MESSAGES
    var message_count = 100;

    for (var i = 0; i < message_count; i++)
    {
        var from = 0;
        var to = 0;

        while (from == to)
        {
            from = test_hf.rand() % profile_count;
            to = test_hf.rand() % profile_count;
        }

        var message = (
            'Hi ' + user_profile[to]['first_name'] +
            '! This is your dude ' + user_profile[from]['first_name'] + '.'
        );

        hf_service.login_user(user_profile[from]);
        hf_service.send_message(user_hash[to], message, function(success){
            test_utils.assert(success == true, 'failed to send message from ' + from + ' to ' + to);
        });
        hf_service.disconnect();
    }

    test_utils.assert_success(message_count);
}


// ------------------------------------------------------ TESTS MAIN ENTRY POINT

test_hf.onload = function()
{
    // init testing API
    test_utils.init();

    // set AJAX request synchronous
    hf_com.synchronized_request = true;

    // list of tests
    test_hf_core.main();
    test_hf_com.main();
    test_hf_service.main();
    test_hf_ui.main();

    // populates the database
    test_utils.run(test_hf.populate_db, 'test_hf.populate_db');

    hf_control.domPageContainer.innerHTML = '<a href="./">GOTO LOGIN</a>';
}



