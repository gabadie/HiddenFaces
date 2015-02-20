
var test_hf = {};

test_hf.onload = function()
{
    // init testing API
    test_utils.init();

    // set AJAX request synchronous
    hf_com.synchronized_request = true;

    // list of tests
    test_hf_com.main();
    test_hf_service.main();
    test_hf_ui.main();
}
