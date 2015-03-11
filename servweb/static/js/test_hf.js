
var test_hf = {};


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
    test_hf_populate.main();

    hf_control.domPageContainer.innerHTML = '<a href="./">GOTO LOGIN</a>';
}
