var test_hf_ui = {};

test_hf_ui.template = function()
{
    var view_name = 'test_view_template.html';
    var template_context = {
        title: "My second Post",
        body: "This is my sencond post!"
    };

    hf_ui.init(function(){
        test_utils.success("init success");
    });

    var a = hf_ui.template(view_name, template_context);

    hf_ui.apply_template(view_name, template_context, test_utils.domSandboxElem, function(){
        test_utils.success("init success");
    });

    test_utils.assert_success(2);
}

test_hf_ui.main = function()
{
    test_utils.run(test_hf_ui.template, 'test_hf_ui.template');
}
