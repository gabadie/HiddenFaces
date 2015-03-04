
// -------------------------------------------------------------------- CONTACTS

hf_control.add_contact = function(user_hash)
{
    hf_service.add_contact(user_hash, function(success){
        assert(success);

        hf_control.refresh_view();
    });
}

hf_control.add_contact_to_circle = function(contact_user_hash, circle_hash)
{
    hf_service.add_contact_to_circle(contact_user_hash, circle_hash, function(success){
        assert(success);
        hf_control.refresh_view();
    });
}

// --------------------------------------------------------------------- LOG IN/OUT

hf_control.signed_out.login = function(domElem)
{
    var user_login_profile = hf.inputs_to_json(domElem);

    if (user_login_profile['email'] == '')
    {
        alert('email required');
        return;
    }

    if (user_login_profile['password'] == '')
    {
        alert('password required');
        return;
    }

    hf_service.login_user(user_login_profile, function(user_hash){
        if (user_hash == null)
        {
            alert('log in failed');
            hf_control.view('/');
            return;
        }

        hf_control.signed_in.view('/');

        /*
         * Saves the login cookie
         */
        var cookie_content = hf_service.get_user_login_cookie(user_login_profile);
        hf.create_cookie(hf_control.userCookieName, cookie_content, 1);
    });
}

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

hf_control.delete_notification = function(notification_hash)
{
    hf_service.delete_notification(notification_hash, function(success){
        assert(success);

        hf_control.refresh_view();
    });
}


// --------------------------------------------------------------------- SIGN UP

hf_control.signed_out.sign_up = function(domElem)
{
    var user_profile = hf.inputs_to_json(domElem);

    if (user_profile['first_name'] == '')
    {
        alert('first name required');
        return;
    }

    if (user_profile['last_name'] == '')
    {
        alert('last name required');
        return;
    }

    if (user_profile['email'] == '')
    {
        alert('email required');
        return;
    }

    if (user_profile['password'] == '')
    {
        alert('password required');
        return;
    }

    if (user_profile['password'] != user_profile['confirm_password'])
    {
        alert('passwords are not matching');
        return;
    }

    hf_service.create_user(user_profile);

    hf_control.signed_out.view('/');
}

