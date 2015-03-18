
var hf_ui_generic = {};


// -------------------------------------------------------------- hf_input_image

Handlebars.registerHelper('hf_input_image', function(name, value, opts) {
    var out = '';
    out += '<div class="hf_input_image">';
    out += '<img src="' + value + '" />';
    out += '<span class="btn btn-default btn-file">';
    out += 'Change picture.';
    out += '<input type="file" name="' + name + '" accept="image/*" onchange="hf_ui_generic.input_image_onchange(this);" />';
    out += '</span>';
    out += '</div>';

    return out;
});

hf_ui_generic.input_image_onchange = function(inputDomElem)
{
    var divElem = inputDomElem.parentNode.parentNode;
    var imgElem = divElem.firstChild;

    hf.input_to_uri(inputDomElem, function(uri){
        imgElem.src = uri;
    });
}


// -------------------------------------------------- hf_input_autocomplete_list

hf_ui_generic.input_autocomplete_list_cursor = 0;

hf_ui_generic.input_autocomplete_list = function(params)
{
    assert(typeof params['name'] == 'string');
    assert(typeof params['placeholder'] == 'string');
    assert(hf.keys(params['values']).length >= 0);
    assert(params['defaults'].length >= 0);

    var id = hf_ui_generic.input_autocomplete_list_cursor++;

    var out = '';

    out += '<div class="hf_form_autocomplete">';
    out += '<input';
    out += ' class="form-control"';
    out += ' type="text"';
    out += ' list="hf_input_datalist_' + id + '"';
    out += ' placeholder="' + params['placeholder'] + '"';
    out += ' autocomplete="off"';
    out += ' onkeypress="return hf_ui_generic.input_autocomplete_list_keypress(event, this);"';
    out += ' />';
    out += '<input type="hidden" value="' + window.btoa(JSON.stringify(params['values'])) + '"/>';
    out += '<datalist id="hf_input_datalist_' + id + '">';

    for (var key in params['values'])
    {
        assert(typeof key == 'string');

        var value = params['values'][key];
        assert(typeof value == 'string');

        out += '<option value="' + value + '" name="' + key + '">' + value + '</option>';
    }

    out += '</datalist>';
    out += '<div class="hf_selected_list">';

    for (var i = 0; i < params['defaults'].length; i++)
    {
        var key = params['defaults'][i];
        assert(typeof key == 'string');
        assert(key in params['values']);

        var value = params['values'][key];
        assert(typeof value == 'string');

        out += (
            '<span class="hf_circle form-control"><span class="hf_circle_name">' +
            value +
            '</span></span>'
        );
    }

    out += '</div>';
    out += '<input type="hidden" name="' + params['name'] + '" value="' + params['defaults'].join('\n') + '">';
    out += '</div>';

    return out;
}

hf_ui_generic.input_autocomplete_list_keypress = function(event, inputDom)
{
    if (event.keyCode != 13)
    {
        return ;
    }

    var valuesDom = inputDom.nextSibling;
    var datalistDom = valuesDom.nextSibling;
    var selectedlistDom = datalistDom.nextSibling;
    var orifinalInputDom = selectedlistDom.nextSibling;

    var selected_value = inputDom.value;
    var selected_key = null;

    //selected option
    var values = JSON.parse(window.atob(valuesDom.value));

    for (var key in values)
    {
        value = values[key];

        if (selected_value == value)
        {
            selected_key = key;
            break;
        }
    }

    if (selected_key === null)
    {
        return;
    }

    assert(typeof selected_key == 'string');

    var selected_keys = orifinalInputDom.value.split('\n');
    if (selected_keys.indexOf(selected_key) >= 0)
    {
        alert('`' + selected_value + '` has already been listed');
        inputDom.value = '';
        return;
    }

    var appendHTML = '<span class="hf_circle form-control">';
    appendHTML += '<input type="hidden" value="' + selected_key + '">';
    appendHTML += '<span class="hf_circle_name">' + selected_value + '</span>';
    appendHTML += '<span class="hf_delete_icon" onclick="return hf_ui_generic.input_autocomplete_list_delete(this);">X</span>';
    appendHTML += '</span>';

    selectedlistDom.innerHTML += appendHTML;
    inputDom.value = '';

    if (orifinalInputDom.value != '')
    {
        orifinalInputDom.value += '\n';
    }

    orifinalInputDom.value += selected_key;
}

hf_ui_generic.input_autocomplete_list_delete = function(dom)
{
    var spanParent = dom.parentNode;
    var divParent = spanParent.parentNode;

    var removed_key = spanParent.firstChild.value;
    var selected_keys = orifinalInputDom.value.split('\n');

    var index = selected_keys.indexOf(removed_key);

    assert(index >= 0);

    selected_keys.splice(index, 1);

    orifinalInputDom.value = selected_keys.join('\n');
    divParent.removeChild(spanParent);
}


// ------------------------------------------ hf_input_autocomplete_list helpers

Handlebars.registerHelper('hf_input_autocomplete_list_users', function(user_public_chunks, options) {
    var params = {
        'name': options.hash['name'],
        'placeholder': 'Type an user name...',
        'values': {},
        'defaults': []
    };

    for (var i = 0; i < user_public_chunks.length; i++)
    {
        var user_public_chunk = user_public_chunks[i];

        params['values'][user_public_chunk['__meta']['user_hash']] = (
            user_public_chunk['profile']['first_name'] + ' ' +
            user_public_chunk['profile']['last_name']
        );
    }

    return hf_ui_generic.input_autocomplete_list(params);
});
