
hf_control.signed_in = new hf_control.ViewRouter(function(callback){
    assert(hf_service.is_connected());

    var template_params = {
        'private_chunk': hf_service.user_private_chunk
    };

    hf_ui.apply_template("page_layout.html", template_params, hf_control.domPageContainer, function(){
        callback();
    });
});

hf_control.signed_in.route('/', function(){

});
