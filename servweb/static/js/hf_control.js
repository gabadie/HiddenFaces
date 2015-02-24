
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

hf_control.onload = function()
{
    hf_control.signed_out.view('/');
}
