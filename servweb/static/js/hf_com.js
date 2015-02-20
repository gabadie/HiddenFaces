
var hf_com = {};

// Configures if we wants synchronized requests. It is set to true when testing.
hf_com.synchronized_request = false;

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
 * @param <callback>: the callback once the chunk is received
 *      function my_callback(status={HTML responses (200==OK)}, json response)
 *
 * @returns <json_message> if synchronized
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

    request.open("POST", "/api/", !hf_com.synchronized_request);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify(request_params));

    if (!hf_com.synchronized_request)
    {
        return;
    }

    /*
     * If we are using synchronized request, we return the json response if any
     */
    assert(request.readyState == 4);
    assert(request.status == 200);

    return JSON.parse(request.responseText);
}

/*
 * @param <chunk_name>: the data chunk's name
 * @param <access_as>: the accessing user's id
 * @param <encryption_key>: the data chunk's encryption key
 * @param <chunk_content>: the data chunk's content to write
 * @param <public_append>: can the other user append
 * @param <callback>: the callback once the chunk is received
 *      function my_callback(json_message)
 *
 * @returns <json_message> if synchronized
 */
hf_com.create_data_chunk = function(chunk_name, access_as, encryption_key, chunk_content, public_append, callback)
{
    assert(typeof access_as == "string", "wrong type for acces_as in create datachunk request")
    assert(typeof chunk_name == "string", "wrong type for chunk_name in create datachunk request")
    assert(chunk_content instanceof Array, "wrong type for chunk_content in create datachunk request")
    assert(typeof public_append == "boolean", "wrong type for public_append in create datachunk request")
    assert(typeof encryption_key == "string", "wrong type for encryption_key in create datachunk request")

    var encrypted_chunk_content = chunk_content.slice();

    for (var i = 0; i < chunk_content.length; i++)
    {
        encrypted_chunk_content[i] = hf_com.encrypt(
            encryption_key,
            chunk_content[i]
        );
    }

    var params = {
        'operation': 'create',
        'user_hash': access_as,
        'chunk_name': chunk_name,
        'chunk_content': encrypted_chunk_content,
        'public_append': public_append
    };

    return hf_com.json_request(params, function(status, json) {
        if (status != 200)
        {
            alert(status);
            return;
        }

        if (callback != null)
        {
            callback(json);
        }
    });
}

/*
 * @param <chunk_name>: the data chunk's name
 * @param <access_as>: the accessing user's id
 * @param <encryption_key>: the data chunk's encryption key
 * @param <chunk_content>: the data chunk's content to write
 * @param <callback>: the callback once the chunk is received
 *      function my_callback(json_message)
 *
 * @returns <json_message> if synchronized
 */
hf_com.write_data_chunk = function(chunk_name, access_as, encryption_key, chunk_content, callback)
{
    assert(typeof access_as == "string", "wrong type for acces_as in write datachunk request")
    assert(typeof chunk_name == "string", "wrong type for chunk_name in write datachunk request")
    assert(chunk_content instanceof Array, "wrong type for chunk_content in write datachunk request")
    assert(typeof encryption_key == "string", "wrong type for encryption_key in write datachunk request")

    var encrypted_chunk_content = chunk_content.slice();

    for (var i = 0; i < chunk_content.length; i++)
    {
        encrypted_chunk_content[i] = hf_com.encrypt(
            encryption_key,
            chunk_content[i]
        );
    }

    var params = {
        'operation': 'write',
        'user_hash': access_as,
        'chunk_name': chunk_name,
        'chunk_content': encrypted_chunk_content
    };

    return hf_com.json_request(params, function(status, json) {
        if (status != 200)
        {
            alert(status);
            return;
        }

        if (callback != null)
        {
            callback(json);
        }
    });
}

/*
 * @param <chunk_name>: the data chunk's name
 * @param <encryption_key>: the data chunk's encryption key
 * @param <chunk_content>: the data chunk's content to append
 * @param <callback>: the callback once the chunk is received
 *      function my_callback(json_message)
 *
 * @returns <json_message> if synchronized
 */
hf_com.append_data_chunk = function(chunk_name, encryption_key, chunk_content, callback)
{
    assert(typeof chunk_name == "string", "wrong type for chunk_name in append datachunk request")
    assert(typeof chunk_content == "string", "wrong type for chunk_content in append datachunk request")
    assert(typeof encryption_key == "string", "wrong type for encryption_key in append datachunk request")

    var params = {
        'operation': 'append',
        'chunk_name': chunk_name,
        'chunk_content': hf_com.encrypt(encryption_key, chunk_content)
    };

    return hf_com.json_request(params, function(status, json) {
        if (status != 200)
        {
            alert(status);
            return;
        }

        if (callback != null)
        {
            callback(json);
        }
    });
}

/*
 * @param <chunk_name>: the data chunk's name
 * @param <decryption_key>: the data chunk's decryption key
 * @param <callback>: the callback once the chunk is received
 *      function my_callback(json_message) (ex: json_message['chunk_content'])
 *
 * @returns <json_message> if synchronized
 */
hf_com.get_data_chunk = function(chunk_name, decryption_key, callback)
{
    assert(typeof chunk_name == "string", "wrong type for chunk_name in get datachunk request")
    assert(typeof decryption_key == "string", "wrong type for decryption_key in get datachunk request")

    var params = {
        'operation': 'get',
        'chunk_name': chunk_name
    };

    return hf_com.json_request(params, function(status, json) {
        if (status != 200)
        {
            alert(status);
            return;
        }

        if (callback != null)
        {
            for (var i = 0; i < json["chunk_content"].length; i++)
            {
                json["chunk_content"][i] = hf_com.decrypt(
                    decryption_key,
                    json["chunk_content"][i]
                );
            }

            callback(json);
        }
    });
}

/*
 * @param <chunk_name>: the data chunk's name
 * @param <access_as>: the accessing user's id
 * @param <callback>: the callback once the chunk is received
 *      function my_callback(json_message)
 *
 * @returns <json_message> if synchronized
 */
hf_com.delete_data_chunk = function(chunk_name, access_as, callback)
{
    assert(typeof access_as == "string", "wrong type for acces_as in delete datachunk request")
    assert(typeof chunk_name == "string", "wrong type for chunk_name in delete datachunk request")

    var params = {
        'operation': 'delete',
        'user_hash': access_as,
        'chunk_name': chunk_name
    };

    return hf_com.json_request(params, function(status, json) {
        if (status != 200)
        {
            alert(status);
            return;
        }

        if (callback != null)
        {
            callback(json);
        }
    });
}

/*
 * @param <encryption_key>: the data's encryption key
 * @param <data>: the data to encrypt.
 *
 * @returns the encrypted data
 */
hf_com.encrypt = function(encryption_key, data)
{
    assert(typeof encryption_key == "string", "wrong type for encryption_key")
    assert(typeof data == "string", "wrong type for data")

    if (encryption_key == '')
    {
        return data;
    }

    assert(false, "TODO: issues #12 and #13");
}

/*
 * @param <decryption_key>: the data's decryption key
 * @param <encrypted_data>: the data to decrypt.
 *
 * @returns the decrypted data
 */
hf_com.decrypt = function(decryption_key, encrypted_data)
{
    assert(typeof decryption_key == "string", "wrong type for encryption_key")
    assert(typeof encrypted_data == "string", "wrong type for encrypted_data")

    if (decryption_key == '')
    {
        return decryption_key;
    }

    assert(false, "TODO: issues #12 and #13");
}
