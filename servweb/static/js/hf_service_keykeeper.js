
// ------------------------------------------------------------- KEYS REPOSITORY
/*
 * Inits a keys' repository in a data chunk content
 *
 * @param <repository_chunk>: the data chunk's content where to create the keys'
 *      repository
 */
hf_service.init_key_repository = function(repository_chunk)
{
    assert(!('keykeeper' in repository_chunk));
    repository_chunk['keykeeper'] = {};
}

/*
 * Stores a key into the keys' repository
 *
 * @caution: the upper layer is responsible for verifying that we are not
 *  clobering a valide key by a not working one.
 *
 * @param <repository_chunk>: the chunk containing the keys repository
 * @param <chunk_name>: the chunk's name we would like to store the key
 * @param <chunk_key>: the chunk's encryption and/or decryption key
 */
hf_service.store_key = function(repository_chunk, chunk_name, chunk_key)
{
    assert('keykeeper' in repository_chunk);
    assert(hf.is_hash(chunk_name));

    var keykeeper = repository_chunk['keykeeper'];

    if (!(chunk_name in keykeeper))
    {
        keykeeper[chunk_name] = {
            'symetric': '',
            'public': '',
            'private': '',
        };
    }

    if (hf_com.is_AES_key(chunk_key) || chunk_key == '')
    {
        assert(hf_com.is_AES_key(chunk_key) || chunk_key == '');

        keykeeper[chunk_name]['symetric'] = chunk_key;
        keykeeper[chunk_name]['public'] = '';
        keykeeper[chunk_name]['private'] = '';
    }
    else if (hf_com.is_RSA_private_key(chunk_key))
    {
        keykeeper[chunk_name]['symetric'] = '';
        keykeeper[chunk_name]['private'] = chunk_key;
    }
    else if (hf_com.is_RSA_public_key(chunk_key))
    {
        keykeeper[chunk_name]['symetric'] = '';
        keykeeper[chunk_name]['public'] = chunk_key;
    }
    else
    {
        assert(false);
    }
}

/*
 * Gets a chunk's encryption key
 *
 * @param <repository_chunk>: the chunk containing the keys repository
 * @param <chunk_name>: the chunk's name we would like to encrypt
 *
 * @returns the encryption key or ''
 */
hf_service.get_encryption_key = function(repository_chunk, chunk_name)
{
    assert('keykeeper' in repository_chunk);
    assert(hf.is_hash(chunk_name));

    if (!(chunk_name in repository_chunk['keykeeper']))
    {
        return '';
    }

    var chunk_keys = repository_chunk['keykeeper'][chunk_name];
    var key = '';

    if (chunk_keys['symetric'])
    {
        key = chunk_keys['symetric'];
        assert(key == '' || hf_com.is_AES_key(key));
    }
    else
    {
        key = chunk_keys['public'];
        assert(key == '' || hf_com.is_RSA_public_key(key));
    }

    return key;
}

/*
 * Gets a chunk's decryption key
 *
 * @param <repository_chunk>: the chunk containing the keys repository
 * @param <chunk_name>: the chunk's name we would like to decrypt
 *
 * @returns the decryption key or ''
 */
hf_service.get_decryption_key = function(repository_chunk, chunk_name)
{
    assert('keykeeper' in repository_chunk);
    assert(hf.is_hash(chunk_name));

    if (!(chunk_name in repository_chunk['keykeeper']))
    {
        return '';
    }

    var chunk_keys = repository_chunk['keykeeper'][chunk_name];
    var key = '';

    if (chunk_keys['symetric'])
    {
        key = chunk_keys['symetric'];
        assert(key == '' || hf_com.is_AES_key(key));
    }
    else
    {
        key = chunk_keys['private'];
        assert(key == '' || hf_com.is_RSA_private_key(key));
    }

    return key;
}


// ---------------------------------------------------------- KEYS NOTIFICATIONS
/*
 * Define a notification interface for /notification/chunk_key
 */
hf_service.define_notification('/notification/chunk_key', {
    automation: function(notification_json)
    {
        assert(hf_service.is_connected());

        var user_private_chunk = hf_service.user_private_chunk;
        var chunk_keys = notification_json['keys'];

        for (var chunk_name in chunk_keys)
        {
            /*
             * TODO: we should check that we can still open this document in
             * the notification's validation (issue #27).
             */
            hf_service.store_key(user_private_chunk, chunk_name, chunk_keys[chunk_name]);
        }
    },
    resolve: null //TODO: if we didn't add as contact
});

/*
 * Sends chunks' keys to severals users.
 *
 * @param <users_hashes>: the users' hashes to send the chunks' keys
 * @param <chunks_keys>: the chunks' key to send {chunk_name -> chunk_key}
 * @param <callback>: the callback once the notifications have been pushed
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.send_chunks_keys = function(users_hashes, chunks_keys, callback)
{
    assert(hf_service.is_connected(), "user not connected in hf_service.send_contact_request");
    assert(hf.is_function(callback));

    for (var chunk_name in chunks_keys)
    {
        assert(hf.is_hash(chunk_name));

        // from a design point of view, we should only send symetric keys
        assert(hf_com.is_AES_key(chunks_keys[chunk_name]));
    }

    var notification_json = {
        '__meta': {
            'type': '/notification/chunk_key',
            'author_user_hash': hf_service.user_hash()
        },
        'keys': hf.clone(chunks_keys)
    };

    var callback_remaining = users_hashes.length;

    if (callback_remaining == 0)
    {
        callback(true);
        return;
    }

    for (var i = 0; i < users_hashes.length; i++)
    {
        hf_service.push_notification(users_hashes[i], notification_json, function(success){
            assert(success);

            callback_remaining--;

            if (callback_remaining == 0)
            {
                callback(true);
            }
        });
    }
}
