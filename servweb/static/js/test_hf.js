
var test_hf = {};

test_hf.populate_db = function()
{
    test_utils.drop_database();

    var user0_profile = {
        'first_name':   'john',
        'last_name':   'smith',
        'email':        'john@smith.com',
        'password':     'hello'
    };

    hf_service.create_user(user0_profile);
}

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
    test_hf.populate_db();

    document.getElementById('pageContent').innerHTML = '<a href="./">GOTO LOGIN</a>';
}
