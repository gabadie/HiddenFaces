
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
            json = JSON.parse(request.responseText);

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
 * Transaction class
 */
hf_com.Transaction = function()
{
    // operations to send
    this.json_operations = [];
    this.commited = false;

    /*
     * Appends a json operation to the transaction
     */
    this.append_operation = function(json_operation)
    {
        assert('__operation' in json_operation);

        this.json_operations[this.json_operations.length] = json_operation;

        assert(this.json_operations.length > 0);

        return this;
    }

    /*
     * Commits the transaction to the server
     * @param <callback>: the callback once transaction completed
     *      function my_callback(json_message)
     *
     * @returns <json_message> if synchronized
     */
    this.commit = function(callback)
    {
        assert(this.commited == false);
        assert(this.json_operations.length > 0);

        var params = {
            'operation': 'transaction',
            'operations': this.json_operations
        };

        this.commited = true;

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
     * @param <owner>: the data chunk's owner
     * @param <encryption_key>: the data chunk's encryption key
     * @param <chunk_content>: the data chunk's content to write
     * @param <public_append>: can the other user append
     */
    this.create_data_chunk = function(chunk_name, owner, encryption_key, chunk_content, public_append)
    {
        assert(typeof chunk_name == "string");
        assert(typeof owner == "string");
        assert(typeof encryption_key == "string");
        assert(typeof public_append == "boolean");

        var encrypted_chunk_content = hf_com.encrypt_content(encryption_key, chunk_content);

        return this.append_operation({
            '__operation':      '/create_data_chunk',
            'title':            chunk_name,
            'content':          encrypted_chunk_content,
            'owner':            owner,
            'append_enabled':   public_append
        })
    }

    /*
     * @param <chunk_name>: the data chunk's name
     * @param <edit_as>: the accessing user's id
     * @param <encryption_key>: the data chunk's encryption key
     * @param <chunk_content>: the data chunk's content to write
     */
    this.write_data_chunk = function(chunk_name, edit_as, encryption_key, chunk_content)
    {
        assert(typeof chunk_name == "string");
        assert(typeof edit_as == "string");
        assert(typeof encryption_key == "string");

        var encrypted_chunk_content = hf_com.encrypt_content(encryption_key, chunk_content);

        return this.append_operation({
            '__operation':      '/write_data_chunk',
            'title':            chunk_name,
            'content':          encrypted_chunk_content,
            'user':             edit_as
        })
    }

    /*
     * @param <chunk_name>: the data chunk's name
     * @param <edit_as>: the accessing user's id
     * @param <encryption_key>: the data chunk's encryption key
     * @param <chunk_content>: the data chunk's content to write
     */
    this.extend_data_chunk = function(chunk_name, edit_as, encryption_key, chunk_content)
    {
        assert(typeof chunk_name == "string");
        assert(typeof edit_as == "string");
        assert(typeof encryption_key == "string");

        var encrypted_chunk_content = hf_com.encrypt_content(encryption_key, chunk_content);

        return this.append_operation({
            '__operation':      '/extend_data_chunk',
            'title':            chunk_name,
            'content':          encrypted_chunk_content,
            'user':             edit_as
        })
    }

    /*
     * @param <chunk_name>: the data chunk's name
     * @param <delete_as>: the deleting user's id
     */
    this.delete_data_chunk = function(chunk_name, delete_as)
    {
        assert(typeof chunk_name == "string");
        assert(typeof delete_as == "string");

        return this.append_operation({
            '__operation':      '/delete_data_chunk',
            'title':            chunk_name,
            'user':             delete_as
        })
    }
}

/*
 * DEPRECATED: Use hf_com.Transaction.create_data_chunk() instead.
 */
hf_com.create_data_chunk = function(chunk_name, access_as, encryption_key, chunk_content, public_append, callback)
{
    return (new hf_com.Transaction()).create_data_chunk(
        chunk_name,
        access_as,
        encryption_key,
        chunk_content,
        public_append
    ).commit(callback);
}

/*
 * DEPRECATED: Use hf_com.Transaction.write_data_chunk() instead.
 */
hf_com.write_data_chunk = function(chunk_name, access_as, encryption_key, chunk_content, callback)
{
    return (new hf_com.Transaction()).write_data_chunk(
        chunk_name,
        access_as,
        encryption_key,
        chunk_content
    ).commit(callback);
}

/*
 * DEPRECATED: Use hf_com.Transaction.append_data_chunk() instead.
 */
hf_com.append_data_chunk = function(chunk_name, access_as, encryption_key, chunk_content, callback)
{
    return (new hf_com.Transaction()).extend_data_chunk(
        chunk_name,
        access_as,
        encryption_key,
        [chunk_content]
    ).commit(callback);
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
            if(typeof json["chunk_content"] != "undefined"){
                for (var i = 0; i < json["chunk_content"].length; i++)
                {
                    json["chunk_content"][i] = hf_com.decrypt(
                        decryption_key,
                        json["chunk_content"][i]
                    );
                }
            }

            callback(json);
        }
    });
}

/*
 * DEPRECATED: Use hf_com.Transaction.delete_data_chunk() instead.
 */
hf_com.delete_data_chunk = function(chunk_name, access_as, callback)
{
    return (new hf_com.Transaction()).delete_data_chunk(
        chunk_name,
        access_as
    ).commit(callback);
}

/*
 * @param <encryption_key>: the chunk content's encryption key
 * @param <chunk_content>: the chunk content to encrypt
 *
 * @returns the encrypted chunk_content
 */
hf_com.encrypt_content = function(encryption_key, chunk_content)
{
    assert(chunk_content instanceof Array);

    var encrypted_chunk_content = chunk_content.slice();

    for (var i = 0; i < chunk_content.length; i++)
    {
        assert(typeof chunk_content[i] == "string");

        encrypted_chunk_content[i] = hf_com.encrypt(
            encryption_key,
            chunk_content[i]
        );
    }

    return encrypted_chunk_content;
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

    if (encryption_key == ''){
         return data;
    }

    if(hf_com.is_AES_key(encryption_key)) {
        return hf_com.encrypt_AES(encryption_key, data);
    } else if (hf_com.is_RSA(encryption_key)){
        return hf_com.encrypt_RSA(encryption_key, data);
    } else {
        assert(false, "your key to encrypt is false");
    }
}

/*
* @param <encryption_key>: the key for encrypting
*
* @return: true if it's key for aes encrypting, false if other
*/
hf_com.is_AES_key = function(key) {
    var splitted_key = key.split("\n")[0];
    return (splitted_key.trim().toUpperCase() === "AES".toUpperCase());
}

/*
* @param <encryption_key>: the key for encrypting
*
* @return: true if it's key for RSA encrypting, false if other
*/
hf_com.is_RSA_key = function(key) {
    var splitted_key = key.split("\n")[0];
    return (splitted_key.trim().toUpperCase() === "RSA-1024-Public".toUpperCase());
}

/*
* @param <encryption_key>: data's encryption key
* @param <data>: data to encrypt
*
* @return: crypted data by AES method
*/
hf_com.encrypt_AES = function(encryption_key, data) {
    var key = hf_com.get_key(encryption_key);
    return sjcl.encrypt(key, data);
}

/*
* @param <encryption_key>: data's encryption key
* @param <data>: data to encrypt
*
* @return: crypted data by RSA method
*/
hf_com.encrypt_RSA = function(encryption_key, data) {
    var key = hf_com.get_key(encryption_key);
   // alert("TODO encrypt RSA");
}

/*
* @param <encryption_key>: data's encryption key
*
* @return: key for crypting 
*/
hf_com.get_key = function(encryption_key) {
    var splitted_key = encryption_key.split("\n");
    var key = "";
    var i;
    for(i = 1; i < splitted_key.length; i++) {
        key += splitted_key[i];
    }
    return key;
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
        return encrypted_data;
    }

    if(hf_com.is_AES_key(decryption_key)) {
        return hf_com.decrypt_AES(decryption_key, encrypted_data);
    } else if (hf_com.is_RSA_key(decryption_key)){
        return hf_com.decrypt_RSA(decryption_key, encrypted_data);
    } else {
        assert(false, "your key to decrypt is false");
    }
}

/*
 * @param <decryption_key>: the data's decryption key
 * @param <encrypted_data>: the data to decrypt.
 *
 * @returns the decrypted data by AES method
 */
hf_com.decrypt_AES = function(decryption_key, encrypted_data) {
    var key = hf_com.get_key(decryption_key);
    return sjcl.decrypt(key, encrypted_data);
}

/*
 * @param <decryption_key>: the data's decryption key
 * @param <encrypted_data>: the data to decrypt.
 *
 * @returns the decrypted data by RSA method
 */
hf_com.decrypt_RSA = function(decryption_key, encrypted_data) {
    //TODO
}
