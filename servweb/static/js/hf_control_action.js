
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

// -------------------------------------------------------------------- SEND MESSAGE
hf_control.send_message = function(domElem)
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


// ----------------------------------------------------------------- DISCUSSIONS

hf_control.add_discussion_peers = function(domElem)
{
    var form_json = hf.inputs_to_json(domElem);

    if (form_json['new_peers'] == '')
    {
        return;
    }

    form_json['new_peers'] = form_json['new_peers'].split('\n');

    hf_service.add_peers_to_discussion(form_json['discussion_hash'], form_json['new_peers'], function(success){
        assert(success, 'failed to add peers');

        hf_control.refresh_view();
    });
}

hf_control.append_post_to_discussion = function(domElem)
{
    var form_json = hf.inputs_to_json(domElem);

    if (form_json['content'] == '')
    {
        return;
    }

    hf_service.append_post_to_discussion(form_json['content'], form_json['discussion_hash'], function(success){
        assert(success);

        hf_control.refresh_view();
    });
}

hf_control.create_new_discussion = function(domElem)
{
    var form_json = hf.inputs_to_json(domElem);

    form_json['peers'] = form_json['peers'].split('\n');

    if (form_json['name'] == '')
    {
        form_json['name'] = null;
    }

    hf_service.create_discussion_with_peers(form_json['name'], form_json['peers'], function(discussion_hash){
        assert(discussion_hash != null);

        hf_control.view('/discussion/' + discussion_hash);
    });
}

hf_control.start_discussion_with_peer = function(user_hash)
{
    hf_service.start_discussion_with_peer(user_hash, function(resolved_discussion){
        if(resolved_discussion['hash'] !== undefined){
            hf_control.view('/discussion/' + resolved_discussion["hash"]);
        }else{
            alert('Cannot start discussion');
        }
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

// --------------------------------------------------------------------- EDIT PROFILE

hf_control.edit_profile = function(domElem)
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

    var user_private_chunk = hf_service.user_private_chunk;

    user_private_chunk['profile']['first_name'] = user_profile['first_name'];
    user_private_chunk['profile']['last_name'] = user_profile['last_name'];
    user_private_chunk['profile']['public_markdown'] = user_profile['public_markdown'];


    hf.input_to_uri(hf.form_input(domElem, 'picture'), function(uri){
        if (uri)
        {
            user_private_chunk['profile']['picture'] = uri;
        }

        hf_service.save_user_chunks(function(success){
            assert(success);
            hf_control.refresh_view();
            return hf_control.view('/profile');
        });
    });
}

// --------------------------------------------------------------------- EDIT LOGIN

hf_control.edit_login_infos = function(domElem)
{
    var user_profile = hf.inputs_to_json(domElem);

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

    hf_service.change_user_login_profile(user_profile,function(success){
        assert(success);
        hf_control.refresh_view();
    });
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

// ------------------------------------------------------------------- Post a comment
hf_control.create_comment = function(commentDom)
{
    var post = hf.inputs_to_json(commentDom);
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

// ------------------------------------------------------------------- New post
hf_control.create_post = function(postDom)
{
    var postElms = hf.inputs_to_json(postDom);
    var circles_hash = [];
    var circles_selected = document.getElementsByClassName('hf_circle_name');

    for(var i = 0; i < circles_selected.length; i++)
    {
        if(!circles_selected[i].getAttribute('name'))
        {
            circles_hash.push(hf_control.current_view_url().split("/")[2]);
        }
        else
        {
            circles_hash.push(circles_selected[i].getAttribute('name'));
        }
    }

    if (circles_hash.length == 0)
    {
        alert('you must select a group');
        return;
    }

    if(postElms['content'].trim() == '')
    {
        alert('you cannot post an empty content');
        return;
    }

    var post_appended = 0;
    var threads = [];
    for(var i = 0; i < circles_hash.length; i++)
    {
        hf_service.get_circle(circles_hash[i], function(circle){
            var symetric_key = hf_service.get_encryption_key(hf_service.user_private_chunk, circle['thread_chunk_name']);
            var thread = {
                'thread_chunk_name': circle['thread_chunk_name'],
                'symetric_key':symetric_key
            };

            threads.push(thread);
            post_appended++;

            if(post_appended == circles_hash.length)
            {
                hf_service.create_post(postElms['content'].trim(), threads, function(success){
                    assert(success);
                    hf_control.refresh_view();
                });
            }
        });
    }
}

// -------------------------------------------------------------- test thread
hf_control.add_thread_list = function(event)
{
    if (event.keyCode != 13)
    {
        return ;
    }

    var circle = document.getElementById('hf_datalist_circles').value.trim();
    var datalist = document.getElementById('circles');
    var selected_value = null;
    //selected option
    for(var i = 0; i < datalist.options.length; i++)
    {
        if(datalist.options[i].value == circle)
            selected_value = datalist.options[i];
    }

    if(selected_value == null)
    {
        return;
    }

    if(selected_value != null)
    {
        var spans = document.getElementsByClassName('hf_circle_name');
        // check selected value
        for(var i = 0; i < spans.length; i++)
        {
            if(spans[i].innerHTML.trim() == circle)
            {
                alert(spans[i].innerHTML.trim() +' is already added');
                document.getElementById('hf_datalist_circles').value = '';
                return;
            }
        }

        var appendHTML = '<span class="hf_circle form-control">';
        appendHTML += '<span class="hf_circle_name" name="'+selected_value.getAttribute('name')+'">'+circle+' </span>';
        appendHTML += '<span class="hf_delete_icon" onclick="return hf_control.delete_thread_list(this);">X</span> </span>';
        document.getElementById('hf_list_circles').innerHTML += appendHTML;

        document.getElementById('hf_datalist_circles').value = '';
    }
}

hf_control.delete_thread_list = function(dom)
{
    var spanParent = dom.parentNode;
    var divParent = spanParent.parentNode;
    divParent.removeChild(spanParent);
}

hf_control.enter_type = function(dom, event)
{
    if (event.keyCode == 13)
    {
        dom.value += "\n";
        return;
    }
}

// ------------------------------------------------------------------------ POST TO GROUP

hf_control.thread_post = function(dom)
{
    var content_arrs = hf.inputs_to_json(dom);
    var post_content = content_arrs['content'].trim();
    if(!post_content)
    {
        alert('you must write something!');
        return;
    }

    var group_info = hf_service.get_thread_infos(hf_control.current_view_url().split("/")[2], function(group){
        if(group != null)
        {
            var thread = {
                'thread_chunk_name': group['name'],
                'symetric_key': group['key']
            }

            hf_service.create_post(post_content, [thread], function(success){
                if(success)
                {
                    assert(success);
                    hf_control.refresh_view();
                }
            });
        }
    });
}

hf_control.subcribe = function(dom)
{
    var arrs = hf.inputs_to_json(dom);
    var content = arrs['content'].trim();
    var group_hash = arrs['group_hash'];

    if(!content)
    {
        alert('Your message cannot be empty!');
        return false;
    }

    hf_service.subscribe_to_group(group_hash, content, function(success){
        assert(success);
        hf_control.refresh_view();
    });
}

hf_control.create_group = function(dom)
{
    var info = hf_control.get_group_infos(dom);
    if (!info){
        return false;
    }

    hf_service.create_group(info['group_name'], info['group_description'], info['group_group_public'], info['group_thread_public'], function(success)
    {
        assert(success != null);
        hf_control.refresh_view();
    });
}

hf_control.approuve_group_user = function(user_hash)
{
    var group_hash = hf_control.current_view_url().split("/")[2];
    assert(hf_service.is_group_admin(group_hash));

    hf_service.add_user_to_group(user_hash, group_hash, function(success){
        assert(success);
        hf_control.refresh_view();
    });
}

hf_control.ignore_group_user = function(notification_hash)
{
    var group_hash = hf_control.current_view_url().split("/")[2];
    assert(hf_service.is_group_admin(group_hash));

    hf_service.delete_group_notification(group_hash, notification_hash, function(success){
        assert(success);
        hf_control.refresh_view();
    });
}

hf_control.save_edit_group_profile = function(dom)
{
    var info = hf_control.get_group_infos(dom);
    if(!info)
    {
        return false;
    }

    hf_service.change_group_profile(hf_control.current_view_url().split("/")[2], info, function(success){
        assert(success);
        hf_control.refresh_view();
    }) ;
}

hf_control.get_group_infos = function(dom)
{
    var out = {};
    var arrs = hf.inputs_to_json(dom);

    var group_name = arrs['name'].trim();
    var description = arrs['description'].trim();

    if(group_name == '')
    {
        alert('group must have a name');
        return false;
    }

    var form_elements = document.getElementById('hf_create_new_group').elements;
    var group_vis = form_elements['group-visilibity'].checked;
    var thread_vis = form_elements['thread-visilibity'].checked;
    if(group_vis)
        thread_vis = true;

    out['group_name'] = group_name;
    out['group_description'] = description;
    out['group_group_public'] = group_vis;
    out['group_thread_public'] = thread_vis;

    return out;
}
