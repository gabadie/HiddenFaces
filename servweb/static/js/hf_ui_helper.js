
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

hf_service.is_contact
