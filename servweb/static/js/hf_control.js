
var hf_control = {};


// the main view router
hf_control.mainViewRouter = null;
hf_control.userCookieName = 'user_cookie';
hf_control.domPageContainer = null;


/*
 * Gets the current view's URL
 */
hf_control.current_view_url = function()
{
    var href = window.location.href.split('#');

    if (href.length < 2)
    {
        return '/';
    }

    assert(href.length == 2);

    return href[1];
}

/*
 * Displays a view
 * @param <viewUrl>: the view's url to display
 *
 * @returns false to have the syntax: href="return hf_control.view(...)"
 */
hf_control.view = function(viewUrl, callback)
{
    assert(hf_control.mainViewRouter != null);

    return hf_control.mainViewRouter.view(viewUrl, callback);
}

/*
 * Refreshes the current view
 */
hf_control.refresh_view = function()
{
    var viewRouter = hf_control.mainViewRouter;

    hf_control.mainViewRouter = null;

    // snapshot the current scroll position
    var top = window.pageYOffset;

    viewRouter.view(hf_control.current_view_url(), function(){
        window.scrollTo(0, top);
    });
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
                return;
            }
        }

        callback();
    }

    /*
     * Routes a function on a view prefix
     *
     * @param <view_prefix>: the view prefix
     * @param <callback>: the callback
     */
    this.route = function(viewPrefix, callback)
    {
        assert(!this.viewPrefix.has(viewPrefix));

        this.viewPrefix.set(viewPrefix, callback);
    }

    /*
     * Displays a view
     * @param <viewUrl>: the view's url to display
     *
     * @returns false to have the syntax: href="return hf_control.view(...)"
     */
    this.view = function(viewUrl, callback)
    {
        if (callback == undefined)
        {
            callback = function(){};
        }
        else
        {
            assert(hf.is_function(callback));
        }

        assert(hf_control.domPageContainer != null);

        var viewRouter = this;

        this.bind(function(){
            var dirs = viewUrl.split("/");
            var matchTry = '/';
            var match_callback = viewRouter.viewPrefix.get(matchTry);

            assert(dirs[0] == '');

            for (var i = 1; i < dirs.length; i++)
            {
                if (i > 1)
                {
                    matchTry += '/';
                }

                matchTry += dirs[i];

                if (i < (dirs.length - 1) && viewRouter.viewPrefix.has(matchTry + '/'))
                {
                    match_callback = viewRouter.viewPrefix.get(matchTry + '/');
                }
                else if (viewRouter.viewPrefix.has(matchTry))
                {
                    match_callback = viewRouter.viewPrefix.get(matchTry);
                }
            }

            window.location.assign('./#' + viewUrl);

            match_callback({
                view_url: viewUrl,
                callback: callback
            });
        });

        return false;
    }
}

hf_control.onload = function()
{
    // set up the page content's DOM element
    hf_control.domPageContainer = document.body;

    window.addEventListener("hashchange", hf_control.refresh_view, false);

    hf_ui.init(function(){
        var user_cookie = hf.get_cookie(hf_control.userCookieName);

        if (user_cookie == null)
        {
            hf_control.signed_out.view('/');

            return;
        }

        hf_service.login_user_cookie(user_cookie, function(user_hash){
            var viewUrl = hf_control.current_view_url();

            if (user_hash == null)
            {
                /*
                 * looks like the connection has failed with this cookie. So we drop
                 * it and load the signed out view '/'
                 */
                hf.delete_cookie(hf_control.userCookieName);
                hf_control.signed_out.view(viewUrl);
                return;
            }

            hf_control.signed_in.view(viewUrl);
        });
    });
}
