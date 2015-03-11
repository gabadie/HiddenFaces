
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
