
var hf_service = {};

/*
 * A user has 3 account's chunks:
 *      - the simetrically crypted private chunk where the owner and the key are
 *      computed from the user's email and the user's password. This chunk
 *      contains the secret user's chunk owner id that is used for all other
 *      chunks owned.
 *      - the uncrypted public chunk where everyone find the user's public
 *      profile containing information such as name, sirname...
 *      - the asimetrically crypted protected chunk where the user have the
 *      private key stored in the private chunk. Therefore only the user can
 *      decrypt the protected chunk's content. But, the chunk name and the public
 *      key is stored in the user's public chunk, and everyone can ONLY append
 *      some crypted data.
 */

/*
 * Resets the entire service's cache
 */
hf_service.reset_cache = function()
{
    hf_service.users_public_chunks = {};
    hf_service.user_private_chunk = null;
}

/*
 * Sends chunks' keys to severals contacts.
 *
 * @param <contacts_hashes>: the users' hashes to send the chunks' keys
 * @param <chunks_infos>: the chunks' infos to send
 *      [
 *          {
 *              'name':             <the chunk's name>,
 *              'type':             <the chunk's type>,
 *              'symetric_key':     <the chunk's symetric key>
 *          }
 *      ]
 *
 * @param <callback>: the callback once the notifications have been pushed
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.send_chunks_infos_to_contacts = function(contacts_hashes, chunks_infos, notification_type, callback)
{
    assert(contacts_hashes.length > 0);
    assert(chunks_infos.length > 0);
    assert(notification_type in hf_service.notification_interface);
    assert(hf.is_function(callback));

    for (var i = 0; i < chunks_infos.length; i++)
    {
        assert('name' in chunks_infos[i]);
        assert('type' in chunks_infos[i]);
        assert('symetric_key' in chunks_infos[i]);

        assert(hf.is_hash(chunks_infos[i]['name']));
        // for now we should only send threads keys
        assert(chunks_infos[i]['type'] == '/thread');
        assert(hf_com.is_AES_key(chunks_infos[i]['symetric_key']));
    }

    var notification_json = {
        '__meta': {
            'type': notification_type,
            'author_user_hash': hf_service.user_hash()
        },
        'chunks': hf.clone(chunks_infos)
    };

    var callback_remaining = contacts_hashes.length;

    for (var i = 0; i < contacts_hashes.length; i++)
    {
        hf_service.push_user_notification(contacts_hashes[i], notification_json, function(success){
            assert(success);

            callback_remaining--;

            if (callback_remaining == 0)
            {
                callback(true);
            }
        });
    }
}

// init cache
hf_service.reset_cache();
