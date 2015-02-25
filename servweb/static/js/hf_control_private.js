
hf_control.signed_in = new hf_control.ViewRouter(function(callback){
    assert(hf_service.is_connected());

    var template_params = {
        'private_chunk': hf_service.user_private_chunk
    };

    hf_ui.apply_template("page_layout.html", template_params, hf_control.domPageContainer, function(){
        hf_control.refresh_left_column();
        callback();
    });
});

hf_control.signed_in.route('/', function(){
    hf_ui.apply_template(
        "list_post.html",
        null,
        document.getElementById('hf_page_main_content')
    );
});

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

hf_control.refresh_left_column = function()
{
    hf_ui.apply_template(
        "list_left_column.html",
        {
            'title': 'Circles',
            'cells': [
                {
                    'name': 'Familly',
                    'view_path': '/circle/1'
                },
                {
                    'name': 'Friends',
                    'view_path': '/circle/2'
                },
                {
                    'name': 'INSA',
                    'view_path': '/circle/3'
                }
            ]
        },
        document.getElementById('hf_left_column_circles')
    );

    hf_ui.apply_template(
        "list_left_column.html",
        {
            'title': 'Groups',
            'cells': [
                {
                    'name': 'INSA IF Promotion 2015',
                    'view_path': '/group/1'
                },
                {
                    'name': 'INSA IF',
                    'view_path': '/group/2'
                },
                {
                    'name': 'Codeurs Anonymes',
                    'view_path': '/group/3'
                }
            ]
        },
        document.getElementById('hf_left_column_groups')
    );
}
