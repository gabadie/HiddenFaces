
var hf_ui = {};
hf_ui.templatesCaches = new Map();

hf_ui.hello = function()
{
    return "Hello world";
}

/*
    @param <page_request>: path to the view's template
    @param <params>: parameters in this view, in sort of json
    @param <domElement>: element dom of html page root
    @return: page html
*/
hf_ui.load_template = function(page_request, params, domElement) {
    if (hf_ui.templatesCaches.has(page_request)) {
        var source = hf_ui.templatesCaches.get(page_request);
        var template = Handlebars.compile(source);

        var content = template(params);
        domElement.innerHTML = content;

    } else {
        hf_ui.load(page_request, params, domElement);
    }
}

/*
    @param <page_request>: path to the view's template
    @param <params>: parameters in this view, in sort of json
    @param <domElement>: element dom of html page root
    @return: page html
*/
hf_ui.load = function(page_request, params, domElement) {

    var xmlhttp = hf_com.new_request();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 ) {
            if(xmlhttp.status == 200){
                var response = JSON.parse(xmlhttp.responseText);
                var status = response['status'];
                if (status == 'ok') {
                    var source = response['page_content'];
                    var template = Handlebars.compile(source);

                    var content = template(params);
                    domElement.innerHTML = content;
                    hf_ui.templatesCaches.set(page_request, source);

                }
            }
        }
    }

    var path_request = {'page_request': 'static/view/' + page_request};

    xmlhttp.open("POST", "/template/", !hf_com.synchronized_request);
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    xmlhttp.send(JSON.stringify(path_request));
}

