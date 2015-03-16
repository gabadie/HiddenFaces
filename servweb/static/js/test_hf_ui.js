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

test_hf_ui.markdown = function()
{
    var src = (
        '# Heading\n' +
        '\n' +
        'Sub-heading\n' +
        '-----------\n' +
        '\n' +
        '### Another deeper heading\n' +
        '\n' +
        'Paragraphs are separated\n' +
        'by a blank line.\n' +
        '\n' +
        'Let 2 spaces at the end of a line to do a\n' +
        'line break\n' +
        '\n' +
        'Text attributes *italic*, **bold**,\n' +
        '`monospace`, ~~strikethrough~~ .\n' +
        '\n' +
        'A [link](http://example.com).\n' +
        '<<<   No space between ] and (  >>>\n' +
        '\n' +
        'Shopping list:\n' +
        '\n' +
        '* apples\n' +
        '* oranges\n' +
        '* pears\n' +
        '\n' +
        'Numbered list:\n' +
        '\n' +
        '1. apples\n' +
        '2. oranges\n' +
        '3. pears\n' +
        '\n' +
        'The rain---not the reign---in\n' +
        'Spain.'
    );

    test_utils.domSandboxElem.innerHTML = '<div class="hf_markdown">' + markdown.toHTML(src) + '</div>';
}

test_hf_ui.main = function()
{
    test_utils.run(test_hf_ui.template, 'test_hf_ui.template');
    test_utils.run(test_hf_ui.markdown, 'test_hf_ui.markdown');
}
