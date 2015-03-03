
var hf_com = {};

// Configures if we wants synchronized requests. It is set to true when testing.
hf_com.synchronized_request = false;

// Bypasses cryptographic stage for easier debuging
hf_com.cryptographic_bypass = false;


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
    this.post_operations = [];
    this.commited = false;

    /*
     * Appends a json operation to the transaction
     *
     * @param <json_operation>: JSON operation syntax to send to the data server
     *      throught the web server
     * @param <receive_callback>: callback to be called once received but before
     *      send back to the user.
     */
    this.append_operation = function(json_operation, receive_callback)
    {
        assert('__operation' in json_operation);

        receive_callback = receive_callback || null;

        this.json_operations[this.json_operations.length] = json_operation;
        this.post_operations[this.post_operations.length] = receive_callback;

        assert(this.json_operations.length > 0);
        assert(this.json_operations.length == this.post_operations.length);

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

        var transaction = this;

        return hf_com.json_request(params, function(status, json) {
            if (status != 200)
            {
                alert(status);
                return;
            }

            assert(transaction.json_operations.length == transaction.post_operations.length);

            if (json['status'] == 'ok')
            {
                for (var i = 0; i < transaction.post_operations.length; i++)
                {
                    if (transaction.post_operations[i] == null)
                    {
                        continue;
                    }

                    transaction.post_operations[i](json, i);
                }
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
     * @param <decryption_key>: the data chunk's decryption key
     *
     *  function commit_callback(json_message)
     *  {
     *      json_message['chunk'][<chunk_name>]
     *  }
     */
    this.get_data_chunk = function(chunk_name, decryption_key)
    {
        assert(typeof chunk_name == "string");
        assert(typeof decryption_key == "string");

        return this.append_operation(
            {
                '__operation':      '/get_data_chunk',
                'title':            chunk_name
            },
            function(json, operation_id){
                if (!('chunk' in json))
                {
                    json['chunk'] = {};
                }

                var encrypted_chunk_content = json['operations_return'][operation_id];
                var chunk_content = [];

                for (var i = 0; i < encrypted_chunk_content.length; i++)
                {
                    chunk_content[i] = hf_com.decrypt(decryption_key, encrypted_chunk_content[i]);
                }

                json['chunk'][chunk_name] = chunk_content;
            }
        )
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
 * @param <chunk_name>: the data chunk's name associated with a value
 * @param <callback>: the callback called once recieved
 *
 *  function commit_callback(json_message)
 *  {
 *      json_message['chunk'][<chunk_name>]
 *  }
 */
hf_com.get_multiple_data_chunks = function(chunk_names, callback)
{
    var transaction = new hf_com.Transaction();

    for (chunk_name in chunk_names)
    {
        var decryption_key = chunk_names[chunk_name];

        transaction.get_data_chunk(chunk_name, decryption_key);
    }

    return transaction.commit(callback);
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
 * DEPRECATED: Use hf_com.Transaction.write_data_chunk() instead
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
 * DEPRECATED: Use hf_com.Transaction.get_data_chunk() or
 *      hf_com.get_multiple_data_chunks() instead.
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
 * Generate AES key
 * @param <salt>: the salt
 *
 * @return the AES key
 */
hf_com.generate_AES_key = function(salt)
{
    var key = 'AES\n' + hf.generate_hash(salt);

    assert(hf_com.is_AES_key(key));

    return key;
}

/*
 * Generate RSA keys 1024 bits
 * @param <callback>: the callback called once recieved
 *
 *  function callback(private_key, public_key)
 */
hf_com.generate_RSA_key = function(callback)
{
    var params = {
        'operation': 'generate_rsa_keys'
    };
    return hf_com.json_request(params, function(status, json) {
        if(status != 200)
        {
            alert(status);
            return;
        }

        if (callback != null)
        {
            callback(json['private_key'], json['public_key']);

        }
    });
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
 * @param <encryption_key>: data's encryption key
 *
 * @return: key for crypting
 */
hf_com.get_key = function(encryption_key) {
    var splitted_key = encryption_key.split("\n");
    var key = "";
    var i;
    for(i = 1; i < splitted_key.length; i++) {
        if (i > 1)
        {
            key += '\n';
        }
        key += splitted_key[i];
    }
    return key;
}

/*
 * @param <key>: the key to ask
 * @param <key_type>: the type to test
 *
 * @return: true if it's key for aes encrypting, false if other
 */
hf_com.is_key_type = function(key, key_type)
{
    var splitted_key = key.split("\n")[0];
    return (splitted_key.trim().toUpperCase() === key_type.toUpperCase());
}

/*
* @param <encryption_key>: the key for encrypting
*
* @return: true if it's key for aes encrypting, false if other
*/
hf_com.is_AES_key = function(key) {
    return hf_com.is_key_type(key, 'AES');
}

/*
* @param <encryption_key>: the key for encrypting
*
* @return: true if it's key for RSA encrypting, false if other
*/
hf_com.is_RSA_public_key = function(key) {
    return hf_com.is_key_type(key, 'RSA-1024-Public');
}
hf_com.is_RSA_private_key = function(key) {
    return hf_com.is_key_type(key, 'RSA-1024-Private');
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

    if (encryption_key == '' || hf_com.cryptographic_bypass)
    {
         return data;
    }

    if (hf_com.is_AES_key(encryption_key))
    {
        return hf_com.encrypt_AES(encryption_key, data);
    }
    else if (hf_com.is_RSA_public_key(encryption_key)){
        return hf_com.encrypt_RSA(encryption_key, data);
    }
    else
    {
        assert(false, "unknwon key type");
    }
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
hf_com.encrypt_RSA = function(encryption_key, data)
{
    // generates an new AES key
    var AES_key = hf.generate_hash(data);

    // encrypts the AES key using RSA
    var encrypt = new JSEncrypt();
    encrypt.setPublicKey(encryption_key);
    var encrypted_AES_key = encrypt.encrypt(AES_key);

    // encrypts the data using AES
    var encrypted_data = sjcl.encrypt(AES_key, data);

    assert(encrypted_AES_key.split(':').length == 1);

    return encrypted_AES_key + ':' + encrypted_data;
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

    if (decryption_key == '' || hf_com.cryptographic_bypass)
    {
        return encrypted_data;
    }

    if (hf_com.is_AES_key(decryption_key))
    {
        return hf_com.decrypt_AES(decryption_key, encrypted_data);
    }
    else if (hf_com.is_RSA_private_key(decryption_key))
    {
        return hf_com.decrypt_RSA(decryption_key, encrypted_data);
    }
    else
    {
        assert(false, "unknwon key type");
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
hf_com.decrypt_RSA = function(decryption_key, encrypted_data)
{
    var encrypted_AES_key = encrypted_data.split(':')[0]
    encrypted_data = encrypted_data.substr(
        encrypted_AES_key.length + 1,
        encrypted_data.length - (encrypted_AES_key.length + 1)
    );

    // decrypts AES key using RSA
    var decrypt = new JSEncrypt();
    decrypt.setPrivateKey(decryption_key);
    var AES_key = decrypt.decrypt(encrypted_AES_key);

    // decrypts data using AES
    return sjcl.decrypt(AES_key, encrypted_data);
}
