
hf_control.signed_out = new hf_control.ViewRouter();

hf_control.signed_out.route('/', function(){
    hf_ui.apply_template("login.html", null, document.getElementById("pageContent"));
});

hf_control.signed_out.route('/signup/', function(){
    hf_ui.apply_template("signup.html", null, document.getElementById("pageContent"));
});

hf_control.signed_out.sign_up = function(domElem)
{
    var user_profile = hf.inputs_to_json(domElem);

    alert(JSON.stringify(user_profile));

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
