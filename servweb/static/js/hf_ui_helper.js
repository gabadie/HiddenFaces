
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

    if (hf_service.is_contact(user_hash))
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

    var out = '<div style="float: right;"> <button ';
    out += 'class="btn btn-default" ';
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
