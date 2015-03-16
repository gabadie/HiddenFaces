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
    out += user_public_chunk['profile']['first_name'];
    out += ' ';
    out += user_public_chunk['profile']['last_name'];
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

Handlebars.registerHelper('hf_add_contact_to_circle', function(contact, circle_hash){

    if (hf_service.is_contact_into_circle(contact['__meta']['user_hash'], circle_hash))
        return '';

    var out = '<div style="float:right;"><button ';
    out += 'class="btn btn-default" style="float:right;" ';
    out += 'onclick="return hf_control.add_contact_to_circle(\''+contact['__meta']['user_hash']+ '\',\'' + circle_hash+'\');"';
    out += '>Add to circle </button></div>';

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
    var group_hash = group['__meta']['group_hash'];
    var group_visibility = group['group']['public'];

    var class_visibility = '';

    if (group_visibility)
    {
        class_visibility = 'hf_group_public';

    }
    else
    {
        try
        {
            var thread_visibility = group['thread']['public'];
            if(thread_visibility == true)
            {
                class_visibility = 'hf_group_public_private';
            }
            else
            {
                class_visibility = 'hf_group_private';
            }
        }
        catch(err)
        {
            class_visibility = 'hf_group_private';
        }
    }

    var out = '<div class="hf_list_item '+class_visibility+'">';
    out += '<div> <a class="hf_user_link " ';
    out += 'onclick="return hf_control.view(\'/group/'+group_hash+'\');">';
    out += group['group']['name'];
    out += '</a>';

    if(!hf_service.already_subscribed(group_hash))
    {
        out+= hf_ui.send_message_dialog(group);
    }

    hf_service.waiting_accept_subcribe(group_hash);

    out += '</div><div class="hf_description">';
    out += group['group']['description'];
    out += '</div></div>' ;
    return out;
});

Handlebars.registerHelper('hf_group_header', function(group) {
    var out = '<div class="hf_title">Group: '+ group['group']['name'];
    var group_hash = group['__meta']['group_hash'];



    if(!hf_service.already_subscribed(group_hash))
        out+= hf_ui.send_message_dialog(group);

    if (hf_service.already_subscribed(group_hash) || group['group']['public'])
    {
        out += '<button class = "btn btn-default btn-sm" style="float:right; margin-right:5px;"';
        out += 'onclick="return hf_control.view(\'/group/'+group_hash+'/contacts'+ '\')";>';
        out += 'Show members </button>';
    }

    out +=  '</div><div style="font-size:12px;">'
            + group['group']['description']
            +' </div>';
    return out;
});

hf_ui.send_message_dialog = function(group)
{
    var group_hash = group['__meta']['group_hash'];
    var out = '';
    out += '<button style="float:right;"';
    out += 'class="btn btn-primary btn-sm" data-toggle="modal" data-target="#hf_subcribe">';
    out += 'Subcribe</button>';

    out += '<div class="modal fade" id="hf_subcribe" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">';

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
