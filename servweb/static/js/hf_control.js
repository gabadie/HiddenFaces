
var hf_control = {};


hf_control.onload = function()
{
    hf_control.show_login_form();
}

hf_control.show_login_form = function()
{
    hf_ui.apply_template("login.html", null, document.getElementById("pageContent"));
}

hf_control.show_inscription_form = function()
{
    hf_ui.apply_template("inscription.html", null, document.getElementById("pageContent"));
}
