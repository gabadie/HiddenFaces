
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
    hf_service.list_notifications(function(notifications_list){
        var template_param = {
            'cells': notifications_list
        };

        hf_ui.apply_template(
            "list_notification.html",
            template_param,
            document.getElementById('hf_page_main_content')
        );
    });
});

