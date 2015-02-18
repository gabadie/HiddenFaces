
var hf_ui = {};
hf_ui.templatesCaches = new Map();

hf_ui.hello = function()
{
    return "Hello world";
}

/*
    @param <viewPath>: path to the view's template
    @param <params>: parameters in this view, in sort of json
    @param <domElement>: element dom of html page root
    @return: page html
*/
hf_ui.load_template = function(viewPath, params, domElement) {
    if (hf_ui.templatesCaches.has(viewPath)) {
        var source = hf_ui.templatesCaches.get(viewPath);
        var template = Handlebars.compile(source);
        var content = template(params);
        domElement.innerHTML = content;
    } else {
        hf_ui.load(viewPath, params, domElement);
    }
}

/*
    @param <viewPath>: path to the view's template
    @param <params>: parameters in this view, in sort of json
    @param <domElement>: element dom of html page root
    @return: page html
*/
hf_ui.load = function(viewPath, params, domElement) {

    var xmlhttp = hf_com.new_request();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 ) {
            if(xmlhttp.status == 200){
                var response = JSON.parse(xmlhttp.responseText);
                var status = response['status'];
                if (status == 'ok') {
                    var source = response['page_content'];
                    var template = Handlebars.compile(source);
                    var content    = template(params);
                    domElement.innerHTML = content;
                    hf_ui.templatesCaches.set(viewPath, source);
                }
            }
        }
    }

    xmlhttp.open("POST", "/template/", !hf_com.synchronized_request);
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    xmlhttp.send(JSON.stringify(viewPath));
}

