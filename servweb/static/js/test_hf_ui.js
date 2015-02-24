var test_hf_ui = {};

// Test function load_template, value return and the cache
test_hf_ui.apply_template = function() {
    var context = {
        title: "My second Post",
        body: "This is my sencond post!"
    };

    var viewPath = 'test_view_template.html';

    hf_ui.templatesCaches = new Map();
    test_utils.assert(hf_ui.templatesCaches.size == 0);

    hf_ui.apply_template(viewPath, context, test_utils.domSandboxElem);
    test_utils.assert(hf_ui.templatesCaches.size == 1, "apply_template() has cached successfully");

    hf_ui.apply_template(viewPath, context, test_utils.domSandboxElem);
    test_utils.assert(hf_ui.templatesCaches.size == 1, "apply_template() has used cache successfully");
}

test_hf_ui.main = function()
{
    test_utils.run(test_hf_ui.apply_template, 'test_hf_ui.apply_template');
}
