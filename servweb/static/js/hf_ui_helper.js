Handlebars.registerHelper('hf_cell', function(options) {
    var out = (
        '<div class="hf_layout_cell"><div class="hf_layout_expand">' +
        options.fn(this) +
        '</div></div>'
    );

    return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('hf_user_link', function(user_public_chunk, options){
    var out = '<a'

    out += ' class="hf_user_link"'
    out += ' onclick="return hf_control.view(\'/profile/' + user_public_chunk['__meta']['user_hash'] + '\');"';
    out += '>';

    if (options.hash['picture'])
    {
        out += '<span class="hf_img">';

        if (user_public_chunk['profile']['picture'])
        {
            out += '<img src="' + user_public_chunk['profile']['picture'] + '" />';
        }

        out += '</span>';
    }

    if (options.hash['picture'] != "only")
    {
        out += user_public_chunk['profile']['first_name'];
        out += ' ';
        out += user_public_chunk['profile']['last_name'];
    }

    out += '</a>';

    return out;
});

Handlebars.registerHelper('hf_discussion_link', function(discussion_infos, options){
    var out = '<a'

    out += ' class="hf_user_link"'
    out += ' onclick="return hf_control.view(\'/discussion/' + discussion_infos['hash'] + '\');"';
    out += '>';
    out += discussion_infos['name'];
    out += '</a>';

    return out;
});

Handlebars.registerHelper('hf_user_add_contact', function(user_public_chunk, options){
    var user_hash = user_public_chunk['__meta']['user_hash'];

    if (hf_service.user_hash() == user_hash || hf_service.is_contact(user_hash))
    {
        return '';
    }

    var out = '<button'

    out += ' class="btn btn-default"'
    out += ' onclick="return hf_control.add_contact(\'' + user_hash + '\');"';
    out += '>Add contact</button>';

    return out;
});

Handlebars.registerHelper('hf_start_discussion', function(user_public_chunk){
    var user_hash = user_public_chunk['__meta']['user_hash'];

    if (hf_service.user_hash() == user_hash)
    {
        return '';
    }

    var out = '<button'

    out += ' class="btn btn-default"'
    out += ' onclick="return hf_control.start_discussion_with_peer(\'' + user_hash + '\');"';
    out += '>Discuss</button>';

    return out;
});

Handlebars.registerHelper('hf_chunk', function(chunk, options){
    var template_name = chunk['__meta']['type'].substring(1) + '.html';

    if (hf_ui.templatesCaches.has(template_name))
    {
        return hf_ui.template(template_name, this);
    }

    var out = '<textarea class="hf_code">';
    out += JSON.stringify(this, null, 4);
    out += '</textarea>'

    return out;
});

Handlebars.registerHelper('hf_date', function(timestamp){
    var date_format = "{{Month}} {{dd}}, {{yyyy}} at {{hh}}:{{mm}}";

    return '<div class="hf_date">' + hf.generate_full_date(date_format, timestamp) + ' </div>';
});

Handlebars.registerHelper('hf_markdown', function(markdown_code){
    assert(typeof markdown_code == 'string');

    return '<div class="hf_markdown">' + markdown.toHTML(markdown_code) + '</div>';
});

Handlebars.registerHelper('if_eq', function(a, b, opts) {

    if(a == b)
        return opts.fn(this);
    else
        return opts.inverse(this);
});

Handlebars.registerHelper('hf_group_link', function(group){
    var out = 'The <a class="hf_group_link" ';
    out += 'onclick="return hf_control.view(\'/group/' + group['__meta']['group_hash'] + '\');">';
    out += group['group']['name'];
    out += '</a> group invited you to subscribe';

    return out;
});

Handlebars.registerHelper('hf_group_sumary', function(group)
{
    var group_hash = group['__meta']['group_hash'];
    var group_visibility = group['group']['public'];

    var group_visibility_prefix = '';

    if (group_visibility)
    {
        group_visibility_prefix = '<em>public group, you can post and comment</em>';
    }
    else
    {
        try
        {
            var thread_visibility = group['thread']['public'];
            if(thread_visibility == true)
            {
                group_visibility_prefix = '<em>protected group, you can view but cannot post and comment</em>';
            }
            else
            {
                group_visibility_prefix = '<em>private group, you just can view, subcribe to post and comment</em>';
            }
        }
        catch(err)
        {
            group_visibility_prefix = '<em>private group, you must subcribe to view, post and comment</em>';
        }
    }

    var out = '<div><a class="hf_group_link"';
    out += ' onclick="return hf_control.view(\'/group/'+group_hash+'\');">';
    out += group['group']['name'];
    out += '</a>';

    var waiting_sub = hf_service.waiting_accept_subcribe(group);

    if(waiting_sub == -1)
    {
        out+= hf_ui.send_message_dialog(group);
    }
    else if (waiting_sub == 0)
    {
        out += '<p class="btn-sm" style="float:right;color:blue;">Waiting for reponse</p>';
    } else if (hf_service.is_group_admin(group_hash))
    {
        out += '<button class="btn btn-sm btn-success" style="float:right;"  onclick="return hf_control.view(\'/group/'+group_hash+'/settings'+ '\')">Settings</button>';
    }

    out += '</div><div class="hf_description"><p>';
    out += group_visibility_prefix + "</br>" + group['group']['description'];
    out += '</p></div>' ;
    return out;
});

Handlebars.registerHelper('hf_group_header', function(group)
{
    // Span for title
    var out = '';
    out += '<div class="hf_title">Group: '+ group['group']['name'];

    var group_hash = group['__meta']['group_hash'];

    var waiting_sub = hf_service.waiting_accept_subcribe(group);

    if (waiting_sub == 0)
        out += '<p class="btn btn-sm" style="float:right;">Waiting for reponse</p>';

    if(waiting_sub == -1)
        out+= hf_ui.send_message_dialog(group);

    out +=  '</div><div style="font-size:12px;">'
            + group['group']['description']
            +' </div>';

    // menu group for public member
    if (waiting_sub == 1 || group['group']['public'])
    {
        out += hf_ui.menu_group(group);
    }

    return out;
});

hf_ui.menu_group = function(group)
{
    var group_hash = group['__meta']['group_hash'];
    var is_admin = hf_service.is_group_admin(group_hash);

    var out = '';
    out += '<div class="hf_group_menu">';

    if((hf_service.waiting_accept_subcribe(group) == 1 || group['group']['public']) && hf_control.current_view_url().split("/").length > 3)
    {
        out += '<button class="btn btn-sm btn-default" style="float:left;" onclick="return hf_control.view(\'/group/'+group_hash+ '\');">Back to thread</button>'
    }

    out += '<button class = "btn btn-default btn-sm"';
    out += 'onclick="return hf_control.view(\'/group/'+group_hash+'/members'+ '\')";>';
    out += 'Show members</button>';

    if(is_admin)
    {
        out += '<button class="btn btn-sm btn-default" onclick="return hf_control.view(\'/group/'+group_hash+'/notifications'+ '\')">Notifications</button>';
        out += '<button class="btn btn-sm btn-success" onclick="return hf_control.view(\'/group/'+group_hash+'/settings'+ '\')">Settings</button>';
    }

    out += '</div>';
    return out;
}

hf_ui.send_message_dialog = function(group)
{
    var group_hash = group['__meta']['group_hash'];
    var out = '';
    out += '<button style="float:right;"';
    out += 'class="btn btn-primary btn-sm" data-toggle="modal" data-target="#hf_subcribe_'+group_hash+'">';
    out += 'Subcribe</button>';

    out += '<div class="modal fade" id="hf_subcribe_'+group_hash+'" tabindex="-1" '
    out += 'role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">';

    out += '<div class="modal-dialog"><div class="modal-content"><div class="modal-header">';
    out += '<h4>Send a message to subcribe '+group['group']['name']+'</h4></div>';

    out += '<form onsubmit="hf_control.subcribe(this); return false;">';
    out += '<div class="modal-body">';

    out += '<textarea name="content" class="form-control" placeholder="Write something to send...">';
    out += '</textarea>';

    out += '<div class="modal-footer">';
    out += '<input type="button" class="btn btn-default" data-dismiss="modal" value="Cancel">';
    out += '<input type="submit" class="btn btn-primary" value="Send">';
    out += '<input type="hidden" value="'+group_hash+'" name="group_hash">';
    out += '</div>';

    out += '</div></form>';
    out += '</div></div></div>';

    return out;
}

Handlebars.registerHelper('hf_linkify', function(text_to_linkify){
    return hf.linkify(text_to_linkify);
});

Handlebars.registerHelper('hf_checked', function(group, group_type){
    var type = "public";
    if (group != null) {
        var group_vis = group['group']['public'];
        var thread_vis = false;

        try {
            thread_vis = group['thread']['public'];
        }
        catch (err) {
        }

        if (group_vis)
        {
            type = "public";
        }
        else if (thread_vis){
            type = "protected";
        } else {
            type = "private";
        }
    }
    return group_type == type ? "checked":"";
});

Handlebars.registerHelper('hf_checkbox_disabled', function(is_public){
    return is_public != null ? "disabled":"";
});
