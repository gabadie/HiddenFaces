
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
    assert(hf.is_function(callback));

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
    hf_ui.apply_template("form/login.html", null, hf_control.domPageContainer);
});

hf_control.signed_out.route('/signup/', function(){
    hf_ui.apply_template("form/signup.html", null, hf_control.domPageContainer);
});


// ------------------------------------------------------------------------ HOME

hf_control.signed_in.route('/', function(){
    var domElem = document.getElementById('hf_page_main_content');

    hf_control.view_new_post(null, function(new_post_html){
        domElem.innerHTML = new_post_html;

        hf_service.list_circles_names(function(circles_names){
            hf_service.list_contacts_threads_names(function(contacts_threads_names){
                var threads_names = contacts_threads_names.concat(circles_names);

                hf_control.view_threads(threads_names, function(posts_html){
                    domElem.innerHTML += posts_html;
                });
            });
        });
    });
});


// -------------------------------------------------------------- CIRCLES' VIEWS

hf_control.signed_in.route('/circles', function(){
    hf_service.list_circles(function(circles_list){
        var template_context = {
            'circles': []
        };

        for(var i = 0; i < circles_list.length; i++)
        {
            var cell = {
                'name': circles_list[i]['name'],
                'view_path': '/circle/' + circles_list[i]['thread_chunk_name']
            };
            template_context['circles'].push(cell);
        }

        document.getElementById('hf_page_main_content').innerHTML = hf_ui.template(
            "list_circles.html",
            template_context
        );
    });
});

hf_control.signed_in.route('/circle/', function() {
    var viewUrl = hf_control.current_view_url();
    var arrs = viewUrl.split("/");
    var circle_hash = viewUrl.split("/")[2];
    if (arrs.length >= 4)
    {
        if(arrs[3] == 'contacts')
        {
            hf_control.circle_contacts(circle_hash);
        }
    }
    else
    {
        hf_control.circle_posts(circle_hash);
    }
});

hf_control.circle_posts = function(circle_hash)
{
    var domElem = document.getElementById('hf_page_main_content');

    hf_service.get_circle(circle_hash, function(circle){
        var circle_header_html = hf_ui.template('header/circle_header.html', circle);

        domElem.innerHTML = circle_header_html;

        hf_control.view_new_post(circle_hash, function(new_post_html){
            domElem.innerHTML += new_post_html;

            hf_service.list_circle_threads_names(circle_hash, function(threads_names){
                hf_control.view_threads(threads_names, function(posts_html){
                    domElem.innerHTML += posts_html;
                });
            });
        });
    });
}

hf_control.circle_contacts = function(circle_hash)
{
    hf_service.get_circle(circle_hash, function(circle)
    {
        hf_service.list_contacts(function(list_contacts)
        {
            var params = {

                'circle_hash': circle_hash,
                'contacts': list_contacts,
                'title' : 'Your contacts.'
            };

            var circle_header_html = hf_ui.template('header/circle_header.html', circle);
            var list_contacts = hf_ui.template('list_users.html',params);

            document.getElementById('hf_page_main_content').innerHTML = (
                circle_header_html + list_contacts
            );
        });
    });
}

// -------------------------------------------------------- NOTIFICATIONS' VIEWS

hf_control.signed_in.route('/notifications', function(){
    var domElem = document.getElementById('hf_page_main_content');

    domElem.innerHTML = hf_ui.template(
        "header/notification_header.html",
        {}
    );

    hf_service.list_user_notifications(function(notifications_list){
        var template_context = {
            'chunks': notifications_list
        };

        domElem.innerHTML += hf_ui.template(
            "list_chunks.html",
            template_context
        );
    });
});

// ------------------------------------------------------ CONTACTS' VIEWS
hf_control.signed_in.route('/contacts', function () {
    hf_service.list_contacts(function(list_contacts) {
        var params = {
            'contacts': list_contacts,
            'title': 'Your contacts'
        };

        hf_ui.apply_template(
            'list_users.html',
            params,
            document.getElementById('hf_page_main_content')
        );
    });
});

// ------------------------------------------------------ CONTACTS' USERS
hf_control.signed_in.route('/global/users', function () {
    hf_service.global_list('/global/users_list', function(users_hashes){
        hf_service.get_users_public_chunks(users_hashes, function(users_public_chunks) {
            var template_context = {
                'contacts': hf.values(users_public_chunks),
                'title' : 'All users'
            };

            for (var i = 0; i < template_context['contacts'].length; i++)
            {
                assert(template_context['contacts'][i] != null);
            }

            hf_ui.apply_template(
                'list_users.html',
                template_context,
                document.getElementById('hf_page_main_content')
            );
        });
    });
});

// ------------------------------------------------------ GROUPS' USERS
hf_control.signed_in.route('/global/groups', function(){
    hf_service.global_list('/global/groups_list', function(groups_hashes){
        hf_service.get_group_public_chunks(groups_hashes, function(groups){
            var template = {
                'groups': groups
            };

            hf_ui.apply_template(
                'list_groups.html',
                template,
                document.getElementById('hf_page_main_content')
            );
        });
    });
});

// ------------------------------------------------------ MESSAGES' VIEWS
hf_control.signed_in.route('/send_message', function(){
    var template_context = {
        'user_hash': ''
    };

    hf_ui.apply_template(
        'send_message.html',
        template_context,
        document.getElementById('hf_page_main_content')
    );
});

hf_control.signed_in.route('/send_message/', function(){

    var viewUrl = hf_control.current_view_url();
    var user_hash = viewUrl.split("/")[2];

    hf_ui.apply_template(
        'send_message.html',
        {'user_hash': user_hash},
        document.getElementById('hf_page_main_content')
    );
});

// ------------------------------------------------------ CONSULT A CONTACT OR CIRCLE

hf_control.signed_in.route('/profile', function (){
    var private_chunk = hf_service.user_private_chunk;
    var html = hf_ui.template(
        'header/user_profile.html',
        private_chunk
    );

    document.getElementById('hf_page_main_content').innerHTML = html;

    hf_service.list_circles_names(function(circles_names){
        hf_control.view_threads(circles_names, function(posts_html){
            document.getElementById('hf_page_main_content').innerHTML += posts_html;
        });
    });
});

hf_control.signed_in.route('/profile/', function (){
    var domElem = document.getElementById('hf_page_main_content');
    var viewUrl = hf_control.current_view_url();
    var user_hash = viewUrl.split("/")[2];

    if (!hf.is_hash(user_hash))
    {
        return hf_control.view('/');
    }
    else if (user_hash == hf_service.user_hash())
    {
        return hf_control.view('/profile');
    }

    hf_service.get_user_public_chunk(user_hash, function(public_chunk) {
        if (!public_chunk)
        {
            return hf_control.view('/');
        }

        domElem.innerHTML = hf_ui.template(
            'header/user_profile.html',
            public_chunk
        );

        if (!hf_service.is_contact(user_hash))
        {
            var message_html = hf_ui.template('send_message.html',
                {'user_hash': user_hash}
            );

            var add_contact = hf_ui.message_cell(
                '{{{hf_user_link this}}} is not in in your contacts list.' +
                '<div class="hf_action_bar" align="right">'+
                    '{{{hf_user_add_contact this}}}'+
                '</div>', public_chunk);

            domElem.innerHTML += add_contact + message_html;

            return;
        }

        hf_service.list_contact_threads_names(user_hash, function(contacts_threads_names){
            if (contacts_threads_names.length == 0)
            {
                var message_html = hf_ui.template('send_message.html',
                    {'user_hash': user_hash}
                );
                var no_post = hf_ui.message_cell(
                    '{{{hf_user_link this}}} hasn\'t shared any post yet.',
                    public_chunk
                );

                domElem.innerHTML += no_post + message_html;
            }
            else
            {
                hf_control.view_threads(contacts_threads_names, function(posts_html){
                    if (posts_html == '')
                    {
                        domElem.innerHTML += hf_ui.message_cell(
                            '{{{hf_user_link this}}} hasn\'t posted yet.',
                            public_chunk
                        );

                        return;
                    }

                    domElem.innerHTML += posts_html;
                });
            }
        });
    });
});



// ------------------------------------------------------ THREADS VIEWS

/*
 * @param <callback>: the callback once the html is fully computed
 *      @param <html>: html code
 *      function my_callback(html)
 */
hf_control.view_new_post = function(current_circle_hash, callback)
{
    hf_service.list_circles(function(circles_list){
        if (current_circle_hash != null && hf_service.is_circle_hash(current_circle_hash))
        {
            hf_service.get_circle(current_circle_hash, function(circle_current){
                var template_context = {
                    'circles': circles_list,
                    'current_circle_name': circle_current['name']
                };

                var html = hf_ui.template('form/new_post.html', template_context);

                callback(html);
            });
        }
        else
        {
           var template_context = {
                'circles': circles_list,
            };

            var html = hf_ui.template('form/new_post.html', template_context);

            callback(html);
        }

    });
}

/*
 * @param <callback>: the callback once the html is fully computed
 *      @param <posts_html>: html of threads' posts
 *      function my_callback(posts_html)
 */
hf_control.view_threads = function(threads_names, callback)
{
    var posts_lists = [];

    if(threads_names.length == 0){
        var template_context = {
            'chunks': posts_list
        };

        var posts_html = hf_ui.template('list_chunks.html', template_context);

        callback(posts_html);
    }

    for (var i = 0; i < threads_names.length; i++)
    {
        hf_service.list_posts(threads_names[i], function(posts_list){
            posts_lists.push(posts_list);
            for(var j = 0; j < posts_list.length; j++)
            {
                posts_list[j]['comments'] = hf_service.qsort_comments(posts_list[j]['comments']);
            }

            if (posts_lists.length == threads_names.length)
            {
                posts_lists = posts_lists.sort();

                posts_list = hf_service.merge_posts_lists(posts_lists);

                var template_context = {
                    'chunks': posts_list
                };

                var posts_html = hf_ui.template('list_chunks.html', template_context);

                callback(posts_html);
            }
        });
    }
}


// ------------------------------------------------------ LEFT MENU

hf_control.refresh_left_column = function()
{
    var left_column = document.getElementById('hf_page_left_column');

    if( left_column == null )
    {
        return;
    }


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

    hf_service.list_groups(function(groups_list){
        var template_context = {
            'title': 'Groups',
            //'title_view_path': '/circles',
            'cells': []
        };

        for (var i = 0; i < groups_list.length; i++)
        {
            var group_cell = {
                'name':         groups_list[i]['group']['name']
                //'view_path':    '/circle/' + circles_list[i]['thread_chunk_name']
            };

            template_context['cells'].push(group_cell);
        }

        document.getElementById('hf_left_column_groups').innerHTML = hf_ui.template(
            "list_left_column.html",
            template_context
        );
    });

    /*hf_ui.apply_template(
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
    );*/
}
