
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
 * @param <chunk_name>: the data chunk's name
 * @param <access_as>: the accessing user's id
 * @param <decryption_key>: the data chunk's decryption key
 * @param <callback>: the callback once the chunk is recived
 *      function my_callback(status={HTML responses (200==OK)}, chunk_content)
 */
hf_com.get_data_chunk = function(chunk_name, access_as, decryption_key, callback)
{
    var request = hf_com.new_request();

    request.onreadystatechange = function()
    {
        if (request.readyState == 4)
        {
            callback(request.status, request.responseText);
        }
    }

    request.open("GET", "/api/" + chunk_name + "/" + access_as, true);
    request.send();
}

/*
 * @param <chunk_name>: the data chunk's name
 * @param <access_as>: the accessing user's id
 * @param <encryption_key>: the data chunk's encryption key
 * @param <chunk_content>: the data chunk's content to write
 * @param <callback>: the callback once the chunk is recived
 *      function my_callback(status={HTML responses (200==OK)}, message)
 */
hf_com.write_data_chunk = function(chunk_name, access_as, encryption_key, chunk_content, callback)
{
    var request = hf_com.new_request();

    request.onreadystatechange = function()
    {
        if (request.readyState == 4)
        {
            callback(request.status, request.responseText);
        }
    }

    request.open("POST", "/api/" + chunk_name + "/" + access_as, true);
    request.setRequestHeader("Content-Type", "text/plain");
    request.send(chunk_content);
}

/*
 * @param <chunk_name>: the data chunk's name
 * @param <access_as>: the accessing user's id
 * @param <encryption_key>: the data chunk's encryption key
 * @param <chunk_content>: the data chunk's content to append
 * @param <callback>: the callback once the chunk is recived
 *      function my_callback(status={HTML responses (200==OK)}, message)
 */
hf_com.append_data_chunk = function(chunk_name, access_as, encryption_key, chunk_content, callback)
{
    var request = hf_com.new_request();

    request.onreadystatechange = function()
    {
        if (request.readyState == 4)
        {
            callback(request.status, request.responseText);
        }
    }

    request.open("PUT", "/api/" + chunk_name + "/" + access_as, true);
    request.setRequestHeader("Content-Type", "text/plain");
    request.send(chunk_content);
}

/*
 * @param <chunk_name>: the data chunk's name
 * @param <access_as>: the accessing user's id
 * @param <encryption_key>: the data chunk's encryption key
 * @param <callback>: the callback once the chunk is recived
 *      function my_callback(status={HTML responses (200==OK)}, message)
 */
hf_com.delete_data_chunk = function(chunk_name, access_as, encryption_key, callback)
{
    var request = hf_com.new_request();

    request.onreadystatechange = function()
    {
        if (request.readyState == 4)
        {
            callback(request.status, request.responseText);
        }
    }

    request.open("DELETE", "/api/" + chunk_name + "/" + access_as, true);
}
