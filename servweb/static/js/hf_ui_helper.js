
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
