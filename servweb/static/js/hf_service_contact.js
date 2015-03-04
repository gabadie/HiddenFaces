
/*
 * @param <user_hash>: contact's user hash
 *
 * @returns true or false
 */
hf_service.is_contact = function(user_hash)
{
    assert(hf_service.is_connected());
    assert(hf.is_hash(user_hash));
    assert(user_hash != hf_service.user_hash());

    return user_hash in hf_service.user_private_chunk['contacts'];
}

/*
 * @param <user_hash>: contact's user hash
 * @param <callback>: the function called once the response has arrived
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.add_contact = function(user_hash, callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback) || callback == undefined);

    if (user_hash == hf_service.user_hash() || (user_hash in hf_service.user_private_chunk['contacts']))
    {
        assert(hf.is_function(callback));
        callback(false);
        return ;
    }

    hf_service.is_user_hash(user_hash, function(is_user_hash)
    {
        if (!is_user_hash)
        {
            callback(false);
            return;
        }

        hf_service.user_private_chunk['contacts'][user_hash] = {
            /*
             * Contact's user hash
             */
            'user_hash': user_hash,

            /*
             * Lists of circles hashes in which this contact is included
             */
            'circles': [],

            /*
             * Lists of threads' names of the contact. The keys are store
             * in the user's keykeeper.
             */
            'threads': []
        };

        hf_service.save_user_chunks(function(success)
        {
            if (callback)
            {
                callback(success);
            }
        });
    });
}

/*
 * Lists contact's public chunks
 * @param <callback>: the function called once the response has arrived
 *      @param <public_chunks>: the contacts' public chunk
 *      function my_callback(public_chunks)
 */
hf_service.list_contacts = function(callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback));

    var contacts = hf_service.user_private_chunk['contacts'];
    var objCount = Object.keys(contacts).length;
    var content=[];

    if (objCount === 0) {
        callback(content);
        return ;
    }

    var iteration = 0;

    for(var contact in contacts) {
        hf_service.get_user_public_chunk(contact, function(public_chunk) {
            if (public_chunk)
            {
                content.push(public_chunk);
            }

            iteration++;
            if (iteration == objCount) {
                callback(content);
            }
        });
    }
}

/*
 * Define a notification interface for /notification/contact_chunks_infos
 */
hf_service.define_notification('/notification/contact_chunks_infos', {
    automation: function(notification_json)
    {
        assert(hf_service.is_connected());

        if (!hf_service.is_contact(notification_json['__meta']['author_user_hash']))
        {
            return 'continue';
        }

        var user_private_chunk = hf_service.user_private_chunk;
        var chunks_infos = notification_json['chunks'];
        var contact_hash = notification_json['__meta']['author_user_hash'];
        var contact_info = hf_service.user_private_chunk['contacts'][contact_hash];

        for (var i = 0; i < chunks_infos.length; i++)
        {
            var chunk_infos = chunks_infos[i];

            if (chunk_infos['type'] == '/thread')
            {
                if (contact_info['threads'].indexOf(chunk_infos['name']) < 0)
                {
                    contact_info['threads'].push(chunk_infos['name']);
                }
            }
            else
            {
                assert(false, 'unexpected type');
            }

            /*
             * TODO: we should check that we can still open this document in
             * the notification's validation (issue #27).
             */
            hf_service.store_key(user_private_chunk, chunk_infos['name'], chunk_infos['symetric_key']);
        }

        return 'discard';
    },
    resolve: hf_service.resolve_notification_author
});

/*
 * Sends chunks' keys to severals contacts.
 *
 * @param <users_hashes>: the users' hashes to send the chunks' keys
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
hf_service.send_chunks_infos_to_contacts = function(contacts_hashes, chunks_infos, callback)
{
    assert(hf_service.is_connected(), "user not connected in hf_service.send_contact_request");
    assert(contacts_hashes.length > 0);
    assert(chunks_infos.length > 0);
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

    for (var i = 0; i < contacts_hashes.length; i++)
    {
        assert(hf_service.is_contact(contacts_hashes[i]));
    }

    var notification_json = {
        '__meta': {
            'type': '/notification/contact_chunks_infos',
            'author_user_hash': hf_service.user_hash()
        },
        'chunks': hf.clone(chunks_infos)
    };

    var callback_remaining = contacts_hashes.length;

    for (var i = 0; i < contacts_hashes.length; i++)
    {
        hf_service.push_notification(contacts_hashes[i], notification_json, function(success){
            assert(success);

            callback_remaining--;

            if (callback_remaining == 0)
            {
                callback(true);
            }
        });
    }
}
