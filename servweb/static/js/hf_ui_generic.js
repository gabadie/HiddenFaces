
var hf_ui_generic = {};


// -------------------------------------------------------------- hf_input_image

Handlebars.registerHelper('hf_input_image', function(name, value, opts) {
    var out = '';
    out += '<div class="hf_input_image">';
    out += '<img src="' + value + '" />';
    out += '<span class="btn btn-default btn-file">';
    out += 'Change picture.';
    out += '<input type="file" name="' + name + '" accept="image/*" onchange="hf_ui_generic.input_image_onchange(this);" />';
    out += '</span>';
    out += '</div>';

    return out;
});

hf_ui_generic.input_image_onchange = function(inputDomElem)
{
    var divElem = inputDomElem.parentNode.parentNode;
    var imgElem = divElem.firstChild;

    hf.input_to_uri(inputDomElem, function(uri){
        imgElem.src = uri;
    });
}
