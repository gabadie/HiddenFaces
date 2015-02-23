
var hf_control = {};

hf_control.hello = function()
{
    return "Hello world";
}

hf_control.onload = function()
{
    hf_control.show_login_form();
}
hf_control.show_login_form = function()
{
    hf_ui.load_template("static/View/login.html",null,document.getElementById("pageContent"));
}
hf_control.show_inscription_form = function()
{
    hf_ui.load_template("static/View/inscription.html",null,document.getElementById("pageContent"));
}
