
var hf_com = {};

hf_com.new_request = function() {
    var request;

    if (window.XMLHttpRequest) {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        request = new XMLHttpRequest();
    } else {
        // code for IE6, IE5
        request = new ActiveXObject("Microsoft.XMLHTTP");
    }

    return request;
}

/*
 * @param <request_params>: unpacked json parameters
 * @param <callback>: the callback once the chunk is recived
 *      function my_callback(status={HTML responses (200==OK)}, json response)
 */
hf_com.json_request = function(request_params, callback) {
    var request = hf_com.new_request();

    request.onreadystatechange = function() {
        if (request.readyState == 4)
        {
            json = JSON.parse(request.responseText)

            callback(request.status, json);
        }
    };

    request.open("POST", "/api/", true);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify(request_params));
}

/*
 * @param <chunk_name>: the data chunk's name
 * @param <access_as>: the accessing user's id
 * @param <encryption_key>: the data chunk's encryption key
 * @param <chunk_content>: the data chunk's content to write
 * @param <public_append>: can the other user append
 * @param <callback>: the callback once the chunk is recived
 *      function my_callback(json_message)
 */
hf_com.create_data_chunk = function(chunk_name, access_as, encryption_key, chunk_content, public_append, callback)
{
    var params = {
        'operation': 'create',
        'user_hash': access_as,
        'chunk_name': chunk_name,
        'chunk_content': chunk_content,
        'public_append': public_append
    };

    hf_com.json_request(params, function(status, json) {
        if (status != 200)
        {
            alert(status);
            return;
        }

        callback(json);
    });
}

/*
 * @param <chunk_name>: the data chunk's name
 * @param <access_as>: the accessing user's id
 * @param <encryption_key>: the data chunk's encryption key
 * @param <chunk_content>: the data chunk's content to write
 * @param <callback>: the callback once the chunk is recived
 *      function my_callback(json_message)
 */
hf_com.write_data_chunk = function(chunk_name, access_as, encryption_key, chunk_content, callback)
{
    var params = {
        'operation': 'write',
        'user_hash': access_as,
        'chunk_name': chunk_name,
        'chunk_content': chunk_content
    };

    hf_com.json_request(params, function(status, json) {
        if (status != 200)
        {
            alert(status);
            return;
        }

        callback(json);
    });
}

/*
 * @param <chunk_name>: the data chunk's name
 * @param <encryption_key>: the data chunk's encryption key
 * @param <chunk_content>: the data chunk's content to append
 * @param <callback>: the callback once the chunk is recived
 *      function my_callback(json_message)
 */
hf_com.append_data_chunk = function(chunk_name, encryption_key, chunk_content, callback)
{
    var params = {
        'operation': 'append',
        'chunk_name': chunk_name,
        'chunk_content': chunk_content
    };

    hf_com.json_request(params, function(status, json) {
        if (status != 200)
        {
            alert(status);
            return;
        }

        callback(json);
    });
}

/*
 * @param <chunk_name>: the data chunk's name
 * @param <decryption_key>: the data chunk's decryption key
 * @param <callback>: the callback once the chunk is recived
 *      function my_callback(json_message) (ex: json_message['chunk_content'])
 */
hf_com.get_data_chunk = function(chunk_name, decryption_key, callback)
{
    var params = {
        'operation': 'get',
        'chunk_name': chunk_name
    };

    hf_com.json_request(params, function(status, json) {
        if (status != 200)
        {
            alert(status);
            return;
        }

        callback(json);
    });
}

/*
 * @param <chunk_name>: the data chunk's name
 * @param <access_as>: the accessing user's id
 * @param <callback>: the callback once the chunk is recived
 *      function my_callback(json_message)
 */
hf_com.delete_data_chunk = function(chunk_name, access_as, callback)
{
    var params = {
        'operation': 'delete',
        'user_hash': access_as,
        'chunk_name': chunk_name
    };

    hf_com.json_request(params, function(status, json) {
        if (status != 200)
        {
            alert(status);
            return;
        }

        callback(json);
    });
}
