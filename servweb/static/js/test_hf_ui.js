var test_hf_ui = {};
var viewPath = {'page_request': 'static/view/test_view_template.html'};
var viewPath2 = {'page_request': 'static/view/test_view_template2.html'};

// Test function load, send a post ajax
test_hf_ui.testLoad = function() {
    var context = {title: "My New Post", body: "This is my first post!"};
    hf_ui.load(viewPath, context, document.getElementById("test_hf_ui_1"));
    test_utils.assert(1, hf_ui.templatesCaches.size);
}

// Test function load_template, value return and the cache
test_hf_ui.test_load_template = function() {
    var context = {title: "My second Post", body: "This is my sencond post!"};
    hf_ui.load(viewPath, context, document.getElementById("test_hf_ui_2"));
    test_utils.assert(1, hf_ui.templatesCaches.size);
}

test_hf_ui.test_load_template2 = function() {
    var context = {body: "This is my third post!"};
    hf_ui.load(viewPath2, context, document.getElementById("test_hf_ui_3"));
    test_utils.assert(2, hf_ui.templatesCaches.size);
}

test_hf_ui.main = function() {

    //test load
    test_utils.run(test_hf_ui.testLoad, 'test_hf_ui.testLoad');

    test_utils.run(test_hf_ui.test_load_template, 'test_hf_ui.test_load_template');
    test_utils.run(test_hf_ui.test_load_template2, 'test_hf_ui.test_load_template2');
}
