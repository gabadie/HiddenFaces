
hf_control.search_focus = function()
{
    document.getElementById('hf_search_submit').style.display = "block";
}

hf_control.search_blur = function()
{
    document.getElementById('hf_search_submit').style.display = "none";
}

hf_control.search_result = function(domElem)
{
    var form_json = hf.inputs_to_json(domElem);

    hf_control.view('/search/' + form_json['search_query']);
}

hf_control.signed_in.route('/search/', function(ctx){
    var search_query = hf_control.current_view_url().substring(8);

    alert(search_query);
});
