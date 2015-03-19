
hf_control.search_focus = function()
{
    document.getElementById('hf_search_submit').style.display = "block";
    document.getElementById('hf_search_submit').style.opacity = 1.0;
}

hf_control.search_blur = function()
{
    document.getElementById('hf_search_submit').style.opacity = 0.0;
    setTimeout(function(){
        document.getElementById('hf_search_submit').style.display = "none";
    }, 500);
}

hf_control.search_result = function(domElem)
{
    var form_json = hf.inputs_to_json(domElem);

    if (form_json['search_query'] == '')
    {
        return;
    }

    hf_control.view('/search/' + form_json['search_query']);
}

hf_control.signed_in.route('/search/', function(ctx){
    var domElem = document.getElementById('hf_page_main_content');
    var search_query = decodeURI(hf_control.current_view_url().substring(8));

    hf_service.search_string_pattern(search_query, function(matching_chunks){
        var template_context = {
            'title': 'Search results.',
            'empty': 'No results found.',
            'chunks': matching_chunks
        };

        domElem.innerHTML = hf_ui.template(
            'list_links.html',
            template_context
        );
    });
});
