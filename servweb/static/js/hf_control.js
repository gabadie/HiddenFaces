
var hf_control = {};


// the main view router
hf_control.mainViewRouter = null;

hf_control.view = function(viewUrl)
{
    assert(hf_control.mainViewRouter != null);

    hf_control.mainViewRouter.view(viewUrl);
}

hf_control.ViewRouter = function(build_up_callback)
{
    this.viewPrefix = new Map();
    this.build_up = build_up_callback || null

    /*
     * Binds this view router as the main view router
     */
    this.bind = function(callback)
    {
        if (hf_control.mainViewRouter != this)
        {
            hf_control.mainViewRouter = this;

            if (this.build_up != null)
            {
                this.build_up(callback);
            }
        }

        callback();
    }

    /*
     * Routes a function on a view prefix
     *
     * @param <view_prefix>: the view prefix
     * @param <callback>: the callback
     *
     *
     *
     */
    this.route = function(viewPrefix, callback)
    {
        assert(!this.viewPrefix.has(viewPrefix));

        this.viewPrefix.set(viewPrefix, callback);
    }

    /*
     * Displays a view
     */
    this.view = function(viewUrl)
    {
        var viewRouter = this;

        this.bind(function(){
            var dirs = viewUrl.split("/");
            var matchTry = '/';
            var match_callback = viewRouter.viewPrefix.get(matchTry);

            assert(dirs[0] == '');

            for (var i = 1; i < dirs.length; i++)
            {
                matchTry += dirs[i] + '/';

                if (viewRouter.viewPrefix.has(matchTry))
                {
                    match_callback = viewRouter.viewPrefix.get(matchTry);
                }
            }

            window.location.assign('./#' + viewUrl);

            match_callback();
        });
    }
}

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
        alert('loged in as: ' + user_hash); // TODO
    });
}

hf_control.onload = function()
{
    hf_control.signed_out.view('/');
}
