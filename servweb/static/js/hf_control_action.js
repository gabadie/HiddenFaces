
// -------------------------------------------------------------------- CONTACTS

hf_control.add_contact = function(user_hash)
{
    hf_service.add_contact(user_hash, function(success){
        assert(success);

        hf_control.refresh_view();
    });
}

// -------------------------------------------------------------------- CONTACT INVITATION
hf_control.contact_invitation = function(domElem)
{
   var invitation_infos = hf.inputs_to_json(domElem);

   if(invitation_infos['destination'] == '')
   {
        alert('destination required');
        return;
   }

   if (invitation_infos['message'] == '')
   {
        alert('message required');
        return;
   }

    hf_service.send_message(invitation_infos['destination'], invitation_infos['message'], function(success){
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

// -------------------------------------------------------------------- CONTACT INVITATION
hf_control.contact_invitation = function(domElem)
{
   var invitation_infos = hf.inputs_to_json(domElem);

   if(invitation_infos['destination'] == '')
   {
        alert('destination required');
        return;
   }

   if (invitation_infos['message'] == '')
   {
        alert('message required');
        return;
   }

    hf_service.send_message(invitation_infos['destination'], invitation_infos['message'], function(success){
        assert(success);

         hf_control.refresh_view();
        });
}


hf_control.clear_message = function()
{
    document.getElementById("text_message").value = "";

}


hf_control.clear_message = function()
{
    document.getElementById("text_message").value = "";

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

hf_control.delete_user_notification = function(notification_hash)
{
    hf_service.delete_user_notification(notification_hash, function(success){
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

// --------------------------------------------------------------------- Circles

hf_control.create_circle = function(domElem)
{
    var user_circle = hf.inputs_to_json(domElem);
    if(user_circle['name'].trim() == '')
        {
            alert('circle name required');
            return;
        }

    hf_service.create_circle(user_circle['name'], function(success){
        assert(success);

        hf_control.refresh_view();
    });
}

hf_control.create_comment = function(commentElement)
{
    var post = hf.inputs_to_json(commentElement);
    var comment = post['content'];

    if (comment.trim() == '')
    {
        alert('comment cannot be empty');
        return;
    }

    var symetric_key = post['symetric_key'];
    var post_chunk_name = post['chunk_name'];

    hf_service.comment_post(post_chunk_name, symetric_key, comment, function(success) {
        assert(success);
        hf_control.refresh_view();
    });
}

