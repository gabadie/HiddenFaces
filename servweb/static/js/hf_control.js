
var hf_control = {};

hf_control.hello = function()
{
    return "Hello world";
}

hf_control.onload = function()
{
    var context = {title: "My New Post", body: "This is my first post!"};
    hf_ui.load_template("/static/views/test.html",context, document.getElementById("test"));
    context = {title: "My New Post", body: "This is my sencond post!"};
    hf_ui.load_template("/static/views/test.html",context, document.getElementById("test2"));
}
