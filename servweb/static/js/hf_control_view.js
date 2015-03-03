
// ---------------------------------------------------------------- VIEW ROUTERS

/*
 * View router when loged out
 */
hf_control.signed_out = new hf_control.ViewRouter();

/*
 * View router when loged in
 */
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


// ------------------------------------------------------------- LOGED OUT VIEWS

hf_control.signed_out.route('/', function(){
    hf_ui.apply_template("login.html", null, hf_control.domPageContainer);
});

hf_control.signed_out.route('/signup/', function(){
    hf_ui.apply_template("signup.html", null, hf_control.domPageContainer);
});


// ------------------------------------------------------------------------ HOME

hf_control.signed_in.route('/', function(){
    hf_ui.apply_template(
        "list_post.html",
        null,
        document.getElementById('hf_page_main_content')
    );
});


// -------------------------------------------------------------- CIRCLES' VIEWS

hf_control.signed_in.route('/circles', function(){
    hf_service.list_circles(function(circles_list){
        var template_context = {
            'circles': circles_list
        };

        document.getElementById('hf_page_main_content').innerHTML = hf_ui.template(
            "list_circles.html",
            template_context
        );
    });
});


// -------------------------------------------------------- NOTIFICATIONS' VIEWS

hf_control.signed_in.route('/notifications', function(){
    hf_service.list_notifications(function(notifications_list){
        var template_param = {
            'chunks': notifications_list
        };

        hf_ui.apply_template(
            "list_chunks.html",
            template_param,
            document.getElementById('hf_page_main_content')
        );
    });
});

// ------------------------------------------------------ CONTACTS' VIEWS
hf_control.signed_in.route('/contacts', function () {
    hf_service.list_contacts(function(list_contacts) {
        console.log(list_contacts);
        var params = {
            'contacts': list_contacts
        };

        hf_ui.apply_template(
            'list_contacts.html',
            params,
            document.getElementById('hf_page_main_content')
        );
    });
});

hf_control.refresh_left_column = function()
{
    hf_service.list_circles(function(circles_list){
        var template_context = {
            'title': 'Circles',
            'title_view_path': '/circles',
            'cells': []
        };

        for (var i = 0; i < circles_list.length; i++)
        {
            var circle_cell = {
                'name':         circles_list[i]['name'],
                'view_path':    '/circle/' + circles_list[i]['thread_chunk_name']
            };

            template_context['cells'].push(circle_cell);
        }

        document.getElementById('hf_left_column_circles').innerHTML = hf_ui.template(
            "list_left_column.html",
            template_context
        );
    });

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
