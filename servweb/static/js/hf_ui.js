
var hf_ui = {};
hf_ui.templatesCaches = new Map();

/*
 * DEPRECATED: use hf_ui.template() instead
 */
hf_ui.apply_template = function(template_name, params, domElement, callback)
{
    assert(domElement);

    domElement.innerHTML = hf_ui.template(template_name, params);

    if (callback)
    {
        callback();
    }
}

/*
 * @param <message_src_code>: string html source code
 * @param <message_context>: parameters in this view
 *
 * @return: html content
 */
hf_ui.message_cell =function(message_src_code, message_context)
{
    assert(typeof message_src_code == 'string');

    var template_src_code = '{{#hf_cell}}<div class="hf_padding">' + message_src_code + '</div>{{/hf_cell}}';
    var compiled_template = Handlebars.compile(template_src_code);
    return compiled_template(message_context);
}
/*
 * @param <template_name>: name of the view template
 * @param <template_context>: parameters in this view, in sort of json
 *
 * @return: html content
 */
hf_ui.template = function(template_name, template_context)
{
    assert(typeof template_name == 'string');
    assert(hf_ui.templatesCaches.has(template_name), 'unknown template: ' + template_name);

    var template = hf_ui.templatesCaches.get(template_name);

    return template(template_context);
}

/*
 * Caches all templates
 */
hf_ui.init = function(callback)
{
    assert(hf.is_function(callback));

    var xmlhttp = hf_com.new_request();

    xmlhttp.onreadystatechange = function()
    {
        if (xmlhttp.readyState != 4)
        {
            return;
        }

        assert(xmlhttp.status == 200);

        var response = JSON.parse(xmlhttp.responseText);

        assert(response['status'] == 'ok');

        var templates_json = response['templates'];

        for (var i = 0; i < templates_json.length; i++)
        {
            var template_json = templates_json[i];
            var compiled_template = Handlebars.compile(template_json['source']);

            hf_ui.templatesCaches.set(template_json['name'], compiled_template);
        }

        callback();
    }

    var request = {
        'operation': 'views_templates'
    };

    xmlhttp.open("POST", "/api/", !hf_com.synchronized_request);
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    xmlhttp.send(JSON.stringify(request));
}
