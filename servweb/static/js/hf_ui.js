
var hf_ui = {};
hf_ui.templatesCaches = new Map();

/*
    @param <template_name>: name of the view template
    @param <params>: parameters in this view, in sort of json
    @param <domElement>: element dom of html page root
    @return: page html
*/
hf_ui.apply_template = function(template_name, params, domElement, callback)
{
    assert(typeof template_name == 'string');
    assert(domElement);

    callback = callback || null;

    if (hf_ui.templatesCaches.has(template_name))
    {
        var template = hf_ui.templatesCaches.get(template_name);

        domElement.innerHTML = template(params);

        if (callback)
        {
            callback();
        }

        return;
    }

    var xmlhttp = hf_com.new_request();

    xmlhttp.onreadystatechange = function()
    {
        if (xmlhttp.readyState == 4)
        {
            if (xmlhttp.status == 200)
            {
                var response = JSON.parse(xmlhttp.responseText);
                var status = response['status'];

                if (status != 'ok')
                {
                    alert('failed to load template `' + template_name + '`');

                    return;
                }

                var template_source = response['template_source'];
                var template = Handlebars.compile(template_source);

                hf_ui.templatesCaches.set(template_name, template);

                domElement.innerHTML = template(params);

                if (callback)
                {
                    callback();
                }
            }
        }
    }

    var path_request = {
        'template_name': template_name
    };

    xmlhttp.open("POST", "/template/", !hf_com.synchronized_request);
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    xmlhttp.send(JSON.stringify(path_request));
}
