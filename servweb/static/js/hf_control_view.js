
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

hf_control.signed_in.route('/', function(ctx){
    var domElem = document.getElementById('hf_page_main_content');

    hf_control.view_new_post(null, function(new_post_html){
        domElem.innerHTML = new_post_html;

        hf_service.list_circles_names(function(circles_names){
            hf_service.list_contacts_threads_names(function(contacts_threads_names){
                var threads_names = contacts_threads_names.concat(circles_names);

                hf_control.view_threads(threads_names, function(posts_html){
                    domElem.innerHTML += posts_html;

                    ctx.callback();
                });
            });
        });
    });
});


// -------------------------------------------------------------- CIRCLES' VIEWS

hf_control.signed_in.route('/circles', function(ctx){
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

        ctx.callback();
    });
});

hf_control.signed_in.route('/circle/', function(ctx) {
    var viewUrl = hf_control.current_view_url();
    var arrs = viewUrl.split("/");
    var circle_hash = viewUrl.split("/")[2];
    if (arrs.length >= 4)
    {
        if(arrs[3] == 'contacts')
        {
            hf_control.circle_contacts(ctx, circle_hash);
        }
    }
    else
    {
        hf_control.circle_posts(ctx, circle_hash);
    }
});

hf_control.circle_posts = function(ctx, circle_hash)
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

                    ctx.callback();
                });
            });
        });
    });
}

hf_control.circle_contacts = function(ctx, circle_hash)
{
    hf_service.get_circle(circle_hash, function(circle)
    {
        hf_service.list_contacts(function(list_contacts)
        {
            var params = {
                'circle_hash': circle_hash,
                'chunks': list_contacts,
                'title': 'Your contacts.',
                'empty': 'You don\'t have any contacts yet'
            };

            var circle_header_html = hf_ui.template('header/circle_header.html', circle);
            var list_contacts = hf_ui.template('list_links.html',params);

            document.getElementById('hf_page_main_content').innerHTML = (
                circle_header_html + list_contacts
            );

            ctx.callback();
        });
    });
}

// ---------------------------------------------------------- DISCUSSIONS' VIEWS

hf_control.signed_in.route('/discussions', function(ctx){
    var domElem = document.getElementById('hf_page_main_content');

    hf_service.list_discussions(function(discussions_map){
        var discussions_infos = [];

        for (var discussion_hash in discussions_map)
        {
            discussions_infos.push({
                'hash': discussion_hash,
                'name': discussions_map[discussion_hash]
            });
        }

        domElem.innerHTML = hf_ui.template(
            "list_discussions.html",
            {discussions: discussions_infos}
        );

        ctx.callback();
    });
});

hf_control.signed_in.route('/discussion/', function(ctx){
    var current_url_arrs = hf_control.current_view_url().split("/");
    var discussion_hash = current_url_arrs[2];

    if (!hf.is_hash(discussion_hash))
    {
        if (discussion_hash == 'create')
        {
            return hf_control.discussion_create(ctx);
        }

        return hf_control.view('/discussions');
    }

    if (!hf_service.is_discussion_hash(discussion_hash))
    {
        return hf_control.view('/discussions');
    }

    if (current_url_arrs[3] == 'peers')
    {
        hf_control.discussion_peers(ctx, discussion_hash);
    }
    else
    {
        hf_control.discussion_thread(ctx, discussion_hash);
    }
});

hf_control.discussion_thread = function(ctx, discussion_hash)
{
    var domElem = document.getElementById("hf_page_main_content");

    hf_service.get_discussion(discussion_hash, function(discussion){
        hf_service.list_posts(discussion_hash, function(posts_list){
            var template_context = {
                'discussion': discussion,
                'posts': posts_list
            };

            domElem.innerHTML = (
                hf_ui.template(
                    'header/discussion_header.html',
                    discussion
                ) +
                hf_ui.template(
                    'form/append_post_to_discussion.html',
                    discussion
                ) +
                hf_ui.template(
                    'list_discussion_posts.html',
                    template_context
                )
            );

            ctx.callback();
        });
    });
}

hf_control.discussion_peers = function(ctx, discussion_hash)
{
    var domElem = document.getElementById("hf_page_main_content");

    hf_service.get_discussion(discussion_hash, function(discussion){
        var template_context = {
            'discussion_view': true,
            'chunks': discussion['peers'],
            'title': 'Discussion\'s peers.',
            'empty': 'YOU SHOULD NOT SEE THIS MESSAGE.'
        };

        domElem.innerHTML = (
            hf_ui.template(
                'header/discussion_header.html',
                discussion
            ) +
            hf_ui.template(
                'list_links.html',
                template_context
            )
        );

        hf_service.list_contacts(function(contacts_list){
            domElem.innerHTML += hf_ui.template(
                'form/add_discussion_peers.html',
                {
                    'contacts': contacts_list,
                    'discussion': discussion
                }
            );

            ctx.callback();
        });
    });
}

hf_control.discussion_create = function(ctx)
{
    var domElem = document.getElementById("hf_page_main_content");

    hf_service.list_contacts(function(contacts_list){
        domElem.innerHTML += hf_ui.template(
            'form/create_new_discussion.html',
            {
                'contacts': contacts_list
            }
        );

        ctx.callback();
    });
}


// -------------------------------------------------------- NOTIFICATIONS' VIEWS

hf_control.signed_in.route('/notifications', function(ctx){
    var domElem = document.getElementById('hf_page_main_content');

    domElem.innerHTML = hf_ui.template(
        "header/notification_header.html",
        {
            'title': 'Your notifications.'
        }
    );

    hf_service.list_user_notifications(function(notifications_list){
        var template_context = {
            'chunks': notifications_list
        };

        domElem.innerHTML += hf_ui.template(
            "list_chunks.html",
            template_context
        );

        ctx.callback();
    });
});

// ------------------------------------------------------ CONTACTS' VIEWS
hf_control.signed_in.route('/contacts', function(ctx) {
    hf_service.list_contacts(function(list_contacts) {
        var params = {
            'chunks': list_contacts,
            'title': 'Your contacts.',
            'empty': 'You don\'t have any contacts yet'
        };

        hf_ui.apply_template(
            'list_links.html',
            params,
            document.getElementById('hf_page_main_content')
        );

        ctx.callback();
    });
});

// ------------------------------------------------------ CONTACTS' USERS
hf_control.signed_in.route('/global/users', function (ctx) {
    hf_service.global_list('/global/users_list', function(users_hashes){
        hf_service.get_users_public_chunks(users_hashes, function(users_public_chunks) {
            var template_context = {
                'chunks': hf.values(users_public_chunks),
                'title' : 'All users.',
                'empty': 'YOU SHOULD NOT SEE THIS MESSAGE.'
            };

            hf_ui.apply_template(
                'list_links.html',
                template_context,
                document.getElementById('hf_page_main_content')
            );

            ctx.callback();
        });
    });
});

// ------------------------------------------------------ GROUPS' USERS
hf_control.signed_in.route('/groups', function(ctx)
{
    hf_service.list_groups(function(groups){
        var template = {
            'chunks': groups,
            'title': "Your groups.",
            'empty': 'You have not subcribed to any groups.',
            'view': 'groups'
        };

        document.getElementById('hf_page_main_content').innerHTML = hf_ui.template(
            'list_links.html',
            template
        );

        ctx.callback();
    });
});

hf_control.signed_in.route('/global/groups', function(ctx){
    hf_service.global_list('/global/groups_list', function(groups_hashes){
        hf_service.get_group_public_chunks(groups_hashes, function(groups){
            var template = {
                'chunks': groups,
                'title': 'All groups.',
                'empty': 'There is no groups on this server.',
                'view': 'groups'
            };

            var list_group_html = hf_ui.template(
                'list_links.html',
                template
            );

            document.getElementById('hf_page_main_content').innerHTML = list_group_html;
            ctx.callback();
        });
    });
});

hf_control.signed_in.route('/group', function(ctx){
    var current_url_arrs = hf_control.current_view_url().split("/");
    var group_hash = current_url_arrs[2];

    if (!hf.is_hash(group_hash))
    {
        if (group_hash == 'create')
        {
            return hf_control.group_create(ctx);
        }

        return hf_control.view('/groups');
    }
    else if (current_url_arrs.length == 3)
    {
        return hf_control.group_thread(ctx, group_hash);
    }
    else if (current_url_arrs[3] === 'contacts')
    {
        return hf_control.group_contacts(ctx, group_hash);
    }
    else if (current_url_arrs[3] == 'notifications')
    {
        return hf_control.group_notifications(ctx, group_hash);
    }
    else if (current_url_arrs[3] == 'settings')
    {
        return hf_control.group_settings(ctx, group_hash);
    }

    return hf_control.view('/group/' + group_hash);
});

hf_control.group_settings = function(ctx, group_hash)
{
    hf_service.get_group_public_chunk(group_hash, function(group){
        var header_html = hf_ui.template(
                'header/group_header.html',
                group
            );

        var edit_view = hf_ui.template(
            'form/edit_group.html',
            {
                'group':group
            }
        );

        document.getElementById('hf_page_main_content').innerHTML = header_html + edit_view;
    });
}

hf_control.group_notifications = function(ctx, group_hash)
{
    hf_service.get_group_public_chunk(group_hash, function(public_chunk)
    {
        var domElem = document.getElementById('hf_page_main_content');
        var header_html = hf_ui.template(
                            'header/group_header.html',
                            public_chunk
                        );

        hf_service.list_group_notifications(group_hash, function(notifications_list){

            var notfi_header = hf_ui.template(
                "header/notification_header.html",
                {
                    'title': 'Your group\'s notifications.'
                }
            );
            var template_context = {
                'chunks': notifications_list
            };

            domElem.innerHTML = header_html + notfi_header + hf_ui.template(
                "list_chunks.html",
                template_context
            );

            ctx.callback();
        });
    });
}

hf_control.group_contacts = function(ctx, group_hash)
{
    hf_service.get_group_public_chunk(group_hash, function(group)
    {
        var header_html = hf_ui.template(
            'header/group_header.html',
            group
        );

        hf_service.list_users(group_hash, function(users) {

            var is_admin = hf_service.is_group_admin(group_hash);
            var template_context = {
                'chunks': users,
                'title' : 'Group\'s members.',
                'is_admin': is_admin,
                'empty': 'YOU SHOULD NOT SEE THIS MESSAGE.'
            };


            var html = hf_ui.template(
                'list_links.html',
                template_context
            );
            document.getElementById('hf_page_main_content').innerHTML = header_html + html;

            ctx.callback();
        });
    });
}

hf_control.group_thread = function(ctx, group_hash)
{
    var domElem = document.getElementById('hf_page_main_content');

    hf_service.get_group_public_chunk(group_hash, function(public_chunk)
    {
        var header_html = hf_ui.template('header/group_header.html', public_chunk);
        domElem.innerHTML = header_html;

        var waiting_sub = hf_service.waiting_accept_subcribe(public_chunk);

        if(waiting_sub == 1 || public_chunk['group']['public'])
        {
            domElem.innerHTML += hf_ui.template('form/new_post.html', {});

            var chunks_names = [];
            try
            {
                chunks_names.push(public_chunk['thread']['name']);
            }
            catch(err){
            }
            finally
            {
                hf_control.view_threads(chunks_names, function(posts_html){
                    domElem.innerHTML += posts_html;
                });

                ctx.callback();
            }
        }
        else
        {
            try
            {
                if(public_chunk['thread']['public'])
                {
                    var chunks_names = [];
                    try
                    {
                        chunks_names.push(public_chunk['thread']['name']);
                        hf_control.view_threads(chunks_names, function(posts_html)
                        {
                            domElem.innerHTML += posts_html;
                        }, false);
                    }
                    catch(err)
                    {
                    }
                }
            }
            catch(err)
            {
            }
        }
    });
}

hf_control.group_create = function(ctx)
{
    var domElem = document.getElementById('hf_page_main_content');

    domElem.innerHTML = hf_ui.template('form/create_new_group.html');
}


// ------------------------------------------------------ MESSAGES' VIEWS
hf_control.signed_in.route('/send_message', function(ctx){
    var template_context = {
        'user_hash': ''
    };

    hf_ui.apply_template(
        'form/send_message.html',
        template_context,
        document.getElementById('hf_page_main_content')
    );

    ctx.callback();
});

hf_control.signed_in.route('/send_message/', function(ctx){

    var viewUrl = hf_control.current_view_url();
    var user_hash = viewUrl.split("/")[2];

    hf_ui.apply_template(
        'form/send_message.html',
        {'user_hash': user_hash},
        document.getElementById('hf_page_main_content')
    );

    ctx.callback();
});

// ------------------------------------------------------ EDIT PROFILE
hf_control.signed_in.route('/edit_profile', function(ctx){
    hf_ui.apply_template(
        'form/edit_profile.html',
        hf_service.user_private_chunk['profile'],
        document.getElementById('hf_page_main_content')
    );

    ctx.callback();
});

// ------------------------------------------------------ EDIT LOGIN INFOS
hf_control.signed_in.route('/edit_login_infos', function(ctx){

    var user_private_chunk = hf_service.user_private_chunk;
    var email = user_private_chunk['profile']['email'];

    var template_context = {
        'email': email
    };

    hf_ui.apply_template(
        'form/edit_login_infos.html',
        template_context,
        document.getElementById('hf_page_main_content')
    );

    ctx.callback();
});


// ------------------------------------------------------ CONSULT A CONTACT OR CIRCLE

hf_control.signed_in.route('/profile', function(ctx){
    var domElem = document.getElementById('hf_page_main_content');
    var private_chunk = hf_service.user_private_chunk;
    var html = (
        hf_ui.template(
            'header/user_profile.html',
            private_chunk
        ) +
        hf_ui.markdown_cell(private_chunk['profile']['public_markdown'])
    );

    domElem.innerHTML = html;

    hf_service.list_circles_names(function(circles_names){
        hf_control.view_threads(circles_names, function(posts_html){
            domElem.innerHTML += posts_html;
        });
    });

    ctx.callback();
});

hf_control.signed_in.route('/profile/', function(ctx){
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

        var markdown_html = hf_ui.markdown_cell(private_chunk['profile']['public_markdown']);

        if (!hf_service.is_contact(user_hash))
        {
            var message_html = hf_ui.template('form/send_message.html',
                {'user_hash': user_hash}
            );

            var add_contact = hf_ui.message_cell(
                '{{{hf_user_link this}}} is not in in your contacts list.' +
                '<div class="hf_action_bar" align="right">'+
                    '{{{hf_user_add_contact this}}}'+
                '</div>', public_chunk);

            domElem.innerHTML += add_contact + markdown_html + message_html;

            ctx.callback();

            return;
        }

        domElem.innerHTML += markdown_html;

        hf_service.list_contact_threads_names(user_hash, function(contacts_threads_names){
            if (contacts_threads_names.length == 0)
            {
                var message_html = hf_ui.template('form/send_message.html',
                    {'user_hash': user_hash}
                );
                var no_post = hf_ui.message_cell(
                    '{{{hf_user_link this}}} hasn\'t shared any post yet.',
                    public_chunk
                );

                domElem.innerHTML += no_post + message_html;

                ctx.callback();
            }
            else
            {
                hf_control.view_threads(contacts_threads_names, function(posts_html){
                    domElem.innerHTML += posts_html;

                    ctx.callback();
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
hf_control.view_threads = function(threads_names, callback, is_comment_enable)
{
    var posts_lists = [];

    if(threads_names.length == 0){
        var template_context = {
            'chunks': posts_lists
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

                if(is_comment_enable == undefined )
                {
                    is_comment_enable = true;
                }

                for(var i = 0; i < posts_list.length; i++)
                {
                    posts_list[i]['is_comment_enable'] = is_comment_enable;
                }

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
            'title_view_path': '/groups',
            'cells': []
        };

        for (var i = 0; i < groups_list.length; i++)
        {
            var group_cell = {
                'name':         groups_list[i]['group']['name'],
                'view_path':    '/group/' + groups_list[i]['__meta']['group_hash']
            };

            template_context['cells'].push(group_cell);
        }

        document.getElementById('hf_left_column_groups').innerHTML = hf_ui.template(
            "list_left_column.html",
            template_context
        );
    });
}
