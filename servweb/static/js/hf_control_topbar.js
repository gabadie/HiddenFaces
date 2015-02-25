
// --------------------------------------------------------------------- LOG OUT
/*
 * Logs out the user
 */
hf_control.log_out = function()
{
    assert(hf_service.is_connected());

    hf.delete_cookie(hf_control.userCookieName);

    /*
     * we reload completly the page by security so that the JS context is fully
     * cleaned.
     */
    window.location.replace("./");

    return false;
}


// --------------------------------------------------------------- NOTIFICATIONS

hf_control.signed_in.route('/notifications', function(){
    hf_ui.apply_template(
        "list_notification.html",
        null,
        document.getElementById('hf_page_main_content')
    );
});

